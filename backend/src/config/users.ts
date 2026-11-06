export interface PrivateUser {
  id: string;
  name: string;
  phone: string;
  pin: string;
}

export const privateUsers: PrivateUser[] = [
  {
    id: "user-1",
    name: process.env.USER_ONE_NAME || "User One",
    phone: process.env.USER_ONE_PHONE || "",
    pin: process.env.USER_ONE_PIN || "",
  },
  {
    id: "user-2",
    name: process.env.USER_TWO_NAME || "User Two",
    phone: process.env.USER_TWO_PHONE || "",
    pin: process.env.USER_TWO_PIN || "",
  },
];