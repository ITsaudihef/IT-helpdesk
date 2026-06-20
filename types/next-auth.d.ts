import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      department: string;
    };
  }
  interface User {
    role: string;
    department: string;
  }
}
