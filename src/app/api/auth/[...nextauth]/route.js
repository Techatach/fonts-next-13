import NexthAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import { signJwtToken } from "@/lib/jwt";
import bcrypt from "@/lib/db";

const handler = NexthAuth({
  providers: [
    CredentialsProvider({
      type: "credentials",
      credentials: {
        username: { label: "Email", type: "text", placeholder: "Kobe Bryant" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const { email, password } = credentials;

        await dbConnect();

        const user = await User.findOne({ email });

        if (!user) {
          throw new Error("Invalid input");
        }

        const comparePass = await bcrypt.compare(password, user.password);

        if (!comparePass) {
          throw new Error("Invalid input");
        } else {
          const { password, ...currentUser } = user._doc;

          const accessToken = signJwtToken(currentUser, { expiresIn: "3d" });

          return {
            ...currentUser,
            accessToken,
          };
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token._id = user._id;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.accessToken = token.accessToken;
      }

      return session;
    },
  },
});

export { handler as GET, handler as POST };
