import { useState, useRef } from "react";
import { Client, handle_file } from "@gradio/client";

const HF_SPACE = import.meta.env.VITE_HF_SPACE;
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

export default function TryOn() {
  const [personFile, setPersonFile]       = useState(null);
  const [shirtFile, setShirtFile]         = useState(null);
  const [personPreview, setPersonPreview] = useState(null);
  const [shirtPreview, setShirtPreview]   = useState(null);
  const [resultUrl, setResultUrl]         = useState(null);
  const [loading, setLoading]             = useState(false);
  const [status, setStatus]               = useState("");
  const [error, setError]                 = useState("");

  const personInputRef = useRef();
  const shirtInputRef  = useRef();

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "person") {
      setPersonFile(file);
      setPersonPreview(url);
    } else {
      setShirtFile(file);
      setShirtPreview(url);
    }
  };

  const handleTryOn = async () => {
    if (!personFile || !shirtFile) {
      setError("Please upload both a person photo and a shirt image.");
      return;
    }

    setError("");
    setLoading(true);
    setStatus("Connecting to server...");
    setResultUrl(null);

    try {
      const client = await Client.connect(HF_SPACE, {
        token: HF_TOKEN,
        status_callback: (s) => {
          if (s.stage === "pending") {
            setStatus(`Queue position: ${s.position ?? "..."}. Please wait...`);
          } else if (s.stage === "running") {
            setStatus("Generating your try-on result... (~30-60 sec)");
          }
        }
      });

      setStatus("Uploading images...");

      const result = await client.predict("/run_tryon", {
        person_img:  handle_file(personFile),
        shirt_img:   handle_file(shirtFile),
        n_steps:     20,
        image_scale: 2.0,
        seed_val:    -1,
      });

      const imgData = result.data[0];
      const imgUrl  = imgData?.url ?? imgData;
      setResultUrl(imgUrl);
      setStatus("Done!");

    } catch (err) {
      console.error(err);
      setError(`Error: ${err.message}. The Space may be loading (cold start). Try again in 30 seconds.`);
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Virtual Shirt Try-On</h1>
      <p style={styles.subtitle}>Upload your photo + a shirt to see how it looks on you</p>

      <div style={styles.uploadRow}>
        <div style={styles.uploadBox}>
          <div style={styles.dropZone} onClick={() => personInputRef.current.click()}>
            {personPreview
              ? <img src={personPreview} style={styles.preview} alt="person" />
              : <div style={styles.placeholder}>Click to upload<br /><small>Your photo</small></div>
            }
          </div>
          <input
            ref={personInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, "person")}
          />
          <p style={styles.label}>Your Photo</p>
        </div>

        <div style={styles.arrow}>+</div>

        <div style={styles.uploadBox}>
          <div style={styles.dropZone} onClick={() => shirtInputRef.current.click()}>
            {shirtPreview
              ? <img src={shirtPreview} style={styles.preview} alt="shirt" />
              : <div style={styles.placeholder}>Click to upload<br /><small>Shirt image</small></div>
            }
          </div>
          <input
            ref={shirtInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, "shirt")}
          />
          <p style={styles.label}>Shirt Image</p>
        </div>

        <div style={styles.arrow}>→</div>

        <div style={styles.uploadBox}>
          <div style={{ ...styles.dropZone, cursor: "default" }}>
            {resultUrl
              ? <img src={resultUrl} style={styles.preview} alt="result" />
              : loading
                ? <div style={styles.placeholder}>{status}</div>
                : <div style={styles.placeholder}>Result appears here</div>
            }
          </div>
          <p style={styles.label}>Try-On Result</p>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        onClick={handleTryOn}
        disabled={loading || !personFile || !shirtFile}
        style={{
          ...styles.button,
          opacity: (loading || !personFile || !shirtFile) ? 0.5 : 1,
          cursor: (loading || !personFile || !shirtFile) ? "not-allowed" : "pointer",
        }}
      >
        {loading ? `${status}` : "Try It On!"}
      </button>

      {resultUrl && (
        <a href={resultUrl} download="tryon-result.png" style={styles.download}>
          Download Result
        </a>
      )}

      <p style={styles.tip}>
        Tip: Use a clear front-facing photo. Shirts on white backgrounds work best.
        First request may take ~60 sec (cold start).
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "system-ui, sans-serif",
    textAlign: "center",
  },
  title:    { fontSize: "2.5rem", marginBottom: "8px" },
  subtitle: { color: "#666", marginBottom: "40px" },
  uploadRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
    marginBottom: "30px",
  },
  uploadBox: { display: "flex", flexDirection: "column", alignItems: "center" },
  dropZone: {
    width: "260px",
    height: "320px",
    border: "2px dashed #ccc",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    overflow: "hidden",
    background: "#fafafa",
  },
  preview:     { width: "100%", height: "100%", objectFit: "cover" },
  placeholder: { color: "#aaa", fontSize: "0.9rem", lineHeight: "1.8" },
  label:       { marginTop: "8px", fontWeight: "600", color: "#333" },
  arrow:       { fontSize: "2rem", color: "#999", padding: "0 10px" },
  button: {
    background: "#7C3AED",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "16px 48px",
    fontSize: "1.1rem",
    fontWeight: "700",
    marginBottom: "16px",
    transition: "background 0.2s",
  },
  download: {
    display: "block",
    marginBottom: "20px",
    color: "#7C3AED",
    textDecoration: "none",
    fontWeight: "600",
  },
  error: { color: "#dc2626", marginBottom: "16px" },
  tip:   { color: "#888", fontSize: "0.85rem", marginTop: "20px" },
};
