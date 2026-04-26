// hooks/useAuth.js
import useApi from "@/hooks/useApi";
import api from "@/services/api";
import {fetchCurrentUserProfile} from "@/services/authProfile";

const useAuth = () => {
    const {request} = useApi();

    const registerUser = (username, password) =>
        request(() => api.post("/register", {username, password}));

    const loginUser = async (username, password) => {
        return request(() => api.post("/login_check", {username, password}));
    };

    const getCurrentUser = () => request(() => fetchCurrentUserProfile());

    return {registerUser, loginUser, getCurrentUser};
};

export default useAuth;
