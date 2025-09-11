import { useMsal } from "@azure/msal-react";

export const SignInButton = () => {
    const { instance } = useMsal();

    const handleLogin = async () => {
        try {
            await instance.loginPopup({
                scopes: ["User.Read"]
            });
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <button 
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
            Sign in with Microsoft
        </button>
    );
};

export default SignInButton;