import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";

export default function AiPlaygroundPage() {
  const { token } = useAuth();
  const [productName, setproductName] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [checkingData, setCheckingData] = useState(true);

  useEffect(() => {
    checkTransactionData();
  }, [token]);

  const checkTransactionData = async () => {
    if (!token) return;
    setCheckingData(true);
    try {
      const res = await api.listTransactions({ limit: 1 }, token);
      setHasTransactions(res.data && res.data.length > 0);
    } catch (error) {
      console.error("Error checking transactions:", error);
      setHasTransactions(false);
    } finally {
      setCheckingData(false);
    }
  };

  const handleFutureInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setproductName(e.target.value);
  };

  const handleGeneratePlan = async () => {
    console.log(productName);
    setLoading(true);
    if (!productName.trim()) {
      alert("Please enter a product name.");
      setLoading(false);
      return;
    }
    try {
      const response = await api.checkAffordability(
        { productName },
        token as string
      );
      setResult(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatAiOutput = (text: string) => {
    // Remove all bold asterisks just in case
    const cleanText = text.replace(/\*\*/g, '');

    // Split on "Explanation:" to get the part after it
    const explanationSplit = cleanText.split('Explanation:');
    const beforeExplanation = explanationSplit[0]?.trim();
    const explanationPart = explanationSplit[1]?.trim();

    return (
      <>
        <span>{beforeExplanation}</span>
        {explanationPart && (
          <>
            <br /><br />
            <strong>Explanation: {explanationPart}</strong>
          </>
        )}
      </>
    );
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h1>Welcome to AiPlaygroundPage</h1>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card mt-5 shadow">
            <div className="card-body d-flex flex-column gap-3">
              <h5 className="card-title">Please enter your future goals</h5>
              <p className="card-text">
                We will use this to generate a plan for you
              </p>
              
              {!checkingData && !hasTransactions && (
                <div className="alert alert-info" role="alert">
                  <i className="bi bi-info-circle me-2"></i>
                  Please add your income and expenditure data in the Dashboard to experience our AI Playground.
                </div>
              )}
              
              <input
                type="text"
                className="form-control"
                placeholder="Enter your future goals"
                value={productName}
                onChange={handleFutureInputChange}
                disabled={!hasTransactions || checkingData}
              ></input>
              <button 
                className="btn btn-primary" 
                onClick={handleGeneratePlan}
                disabled={!hasTransactions || checkingData || loading}
              >
                {loading ? "Generating..." : "Check Affordability"}
                {loading ? (
                  <span className="spinner-grow spinner-grow-sm ms-2" role="status"></span>
                ) : null}
              </button>
            </div>
            {result ? (
              <div className="card-body">
                <h5 className="card-title">Result</h5>
                <p className="card-text">
                  {formatAiOutput(result.productDetails.aiOutput)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
