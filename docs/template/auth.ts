import { jwtDecode } from "jwt-decode";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "./lib/zod";
import { apiAuthLogin, apiAuthRefresh } from "./utils/api";

const LOGIN_PATH = process.env.NEXT_PUBLIC_LOGIN_PATH as string;

declare module "next-auth" {
  interface User {
    accessToken: string;
    refreshToken: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);
          const user =  await apiAuthLogin(email, password);
          return user;
        } catch (error) {
          console.error(error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: LOGIN_PATH,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      if (nextUrl.pathname === LOGIN_PATH) {
        return true;
      }
      return !!auth?.user;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          user: user,
          exp: jwtDecode(user.accessToken).exp,
        };
      }

      if (token.exp && token.exp < Date.now() / 1000) {
        try {
          const { accessToken, refreshToken } = await apiAuthRefresh(
            (token.user as { accessToken: string }).accessToken,
            (token.user as { refreshToken: string }).refreshToken
          );
          token.user = {
            ...(token.user as object),
            accessToken,
            refreshToken,
            exp: jwtDecode(accessToken).exp,
          };
        } catch (error) {
          console.error(error);
          return { ...token, error: "RefreshAccessTokenError" as const }
        }
      }

      return token
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
  },
});
