import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authRoutes, protectedRoutes } from "./router/routes";
import { AuthService } from "./services/auth.service";

const authService = new AuthService("https://dummyjson.com");

const getCookieExpiration = (cookieName: string, isRefreshToken: boolean): number => {
  const expiresInMinutes = isRefreshToken ? 7 * 24 * 60 : 30; // 7 days for refresh token, 30 minutes for access token
  const expirationDate = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  return expirationDate.getTime();
};

export async function middleware(request: NextRequest) {
  console.log("Middleware is running");

  const currentUser = request.cookies.get("currentUser")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  let user = currentUser ? JSON.parse(currentUser) : null;
  const accessToken = user ? user.token : null;

  const accessTokenExpiresAt = getCookieExpiration("token", false);
  const isUserAuthenticated = accessToken && Date.now() <= accessTokenExpiresAt;

  console.log("Current User:", user);

  const refreshTokenIfNeeded = async () => {
    if (refreshToken && !isUserAuthenticated) {
      try {
        const { token, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken);
        const accessTokenExpiresInMinutes = 30;
        const refreshTokenExpiresInDays = 7;

        const response = NextResponse.next();
        response.cookies.set("token", token, { expires: accessTokenExpiresInMinutes / 1440 });
        response.cookies.set("refreshToken", newRefreshToken, { expires: refreshTokenExpiresInDays });
        response.cookies.set("currentUser", JSON.stringify(user), { expires: accessTokenExpiresInMinutes / 1440 });
        return response;
      } catch (error) {
        console.error("Error refreshing token:", error);
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete("currentUser");
        response.cookies.delete("refreshToken");
        return response;
      }
    }
    return null;
  };

  if (!isUserAuthenticated) {
    const refreshedResponse = await refreshTokenIfNeeded();
    if (refreshedResponse) {
      return refreshedResponse;
    }
  }

  if (protectedRoutes.includes(request.nextUrl.pathname) && !isUserAuthenticated) {
    console.log("Redirecting to login");
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("currentUser");
    response.cookies.delete("refreshToken");
    return response;
  }

  if (authRoutes.includes(request.nextUrl.pathname) && isUserAuthenticated) {
    console.log("Redirecting to profile");
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}
