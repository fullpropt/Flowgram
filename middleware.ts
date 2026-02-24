import { withAuth } from "next-auth/middleware";

export default withAuth({
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/ideas/:path*", "/organize/:path*", "/calendar/:path*", "/api/state"],
};
