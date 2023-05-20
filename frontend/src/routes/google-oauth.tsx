import { FC, useEffect } from "react";
const GoogleOAuth: FC = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      window.location.href = "http://127.0.0.1:5000/oauth/google-oauth";
    } else if (process.env.NODE_ENV === "production") {
      window.location.href = "/oauth/google-oauth";
    }
  }, []);

  return <div>GoogleOAuth</div>;
};

export default GoogleOAuth;
