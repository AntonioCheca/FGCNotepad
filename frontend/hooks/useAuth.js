// hooks/useAuth.js
import useApi from "@/hooks/useApi";
import api from "@/services/api";

const useAuth = () => {
    const {request} = useApi();

    const registerUser = (username, password) =>
        request(() => api.post("/register", {username, password}));

    const loginUser = async (username, password) => {
        const data = await request(() => api.post("/login_check", {username, password}));
        if (data.token) localStorage.setItem("jwt", data.token);
        return data;
    };

    return {registerUser, loginUser};
};

export default useAuth;
