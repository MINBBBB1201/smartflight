// Dummy Google Auth functions for demonstration. Replace with real implementation as needed.

export interface User {
  name: string;
  photo: string;
}

let currentUser: User | null = null;

export function getUser(): User | null {
  return currentUser;
}

export async function signInWithGoogle(): Promise<User> {
  // Simulate Google sign-in
  currentUser = {
    name: "홍길동",
    photo: "https://randomuser.me/api/portraits/men/1.jpg"
  };
  return currentUser;
}

export async function signOut(): Promise<void> {
  currentUser = null;
}
