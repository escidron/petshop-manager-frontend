export interface SignupPayload {
  user: {
    email: string;
    password: string;
    name: string;
  };
  tenant: {
    name: string;
    email?: string;
    phone: string;
    document?: string | null;
    plan_code: "MONTHLY" | "FREE_TRIAL";
    whatsapp_package?: string | null;
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}