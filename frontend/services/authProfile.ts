import api from "@/services/api";
import {AuthProfile} from "@/src/types/auth";

export async function fetchCurrentUserProfile(): Promise<AuthProfile> {
    const response = await api.get("/profile/me");
    return response.data as AuthProfile;
}
