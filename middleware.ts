import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/ideas/:path*", "/organize/:path*", "/calendar/:path*", "/api/state"],
};
