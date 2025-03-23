import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.REACT_APP_AXIOS_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

export default axiosInstance;