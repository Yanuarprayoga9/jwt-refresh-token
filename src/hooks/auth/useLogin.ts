import { authService } from "../../services";
import Cookies from "js-cookie";
import { User } from "../../types/user";

export const useLogin = () => {
  const login = async (username: string, password: string) => {
    const user = await authService.login(username, password);
    if (user) {
      const accessTokenExpiresInMinutes = 30; // Access token expires in 30 minutes
      const refreshTokenExpiresInDays = 7; // Refresh token expires in 7 days

      // Set cookies with different expiration times
      Cookies.set("currentUser", JSON.stringify(user));
      Cookies.set("token", user.token, { expires: accessTokenExpiresInMinutes / 1440 });
      Cookies.set("refreshToken", user.refreshToken, { expires: refreshTokenExpiresInDays });
    }
    return user as User;
  };

  const refreshToken = async () => {
    const storedRefreshToken = Cookies.get("refreshToken");
    if (storedRefreshToken) {
      const refreshedTokens = await authService.refreshToken(storedRefreshToken);
      if (refreshedTokens) {
        const accessTokenExpiresInMinutes = 30; // Access token expires in 30 minutes
        const refreshTokenExpiresInDays = 7; // Refresh token expires in 7 days

        // Set cookies with different expiration times
        Cookies.set("token", refreshedTokens.token, { expires: accessTokenExpiresInMinutes / 1440 });
        Cookies.set("refreshToken", refreshedTokens.refreshToken, { expires: refreshTokenExpiresInDays });
        return refreshedTokens;
      }
    }
    throw new Error("No refresh token found or refresh failed.");
  };

  return { login, refreshToken };
};
