import axios, { AxiosInstance } from "axios";
import { getAuthorizationHeader } from "../utils/getAuthorizationHeader";

export class AuthService {
  protected readonly instance: AxiosInstance;
  public constructor(url: string) {
    this.instance = axios.create({
      baseURL: url,
      timeout: 30000,
      timeoutErrorMessage: "Time out!",
    });
  }

  login = (username: string, password: string) => {
    return this.instance
      .post("/auth/login", {
        username,
        password,
        expiresInMins: 1, // o
      })
      .then((res) => {
        return {
          id: res.data.id,
          username: res.data.username,
          email: res.data.email,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          gender: res.data.gender,
          image: res.data.image,
          token: res.data.token,
          refreshToken: res.data.refreshToken,
        };
      });
  };
  refreshToken = (refreshToken: string) => {
    return this.instance
      .post("/auth/refresh", {
        refreshToken,
        expiresInMins: 1, // optional
      })
      .then((res) => {
        return {
          token: res.data.token,
          refreshToken: res.data.refreshToken,
        };
      });
  };
  getMe = (userId: string) => {
    return this.instance
      .get(`/users/${userId}`, {
        headers: getAuthorizationHeader(),
      })
      .then((res) => {
        return res.data;
      });
  };

  uploadAvatar = (userId: string, newAvatar: File) => {
    const formData = new FormData();
    formData.append("file", newAvatar);
    return this.instance
      .post(`/users/${userId}/upload`, formData, {
        headers: getAuthorizationHeader(),
      })
      .then((res) => {
        return {
          newAvatar: res.data.data.url,
        };
      });
  };
}