import React from "react";
import { useHistory } from "react-router-dom";

const API_URL = "http://localhost:4000";

const Main = () => {
  const history = useHistory();

  return (
    <>
      <h2>Xero Invoice Creation</h2>
      <button
        className="btn btn-primary"
        onClick={() => history.push(`/connect`)}
      >
        Connect
      </button>
      <button
        className="btn btn-danger ml-3"
        onClick={() => history.push("/invoice")}
      >
        Create Invoice
      </button>
    </>
  );
};

export default Main;
