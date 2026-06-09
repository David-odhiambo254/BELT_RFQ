import { useEffect, useState } from "react";

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google?: any;
  }
}

const GoogleTranslate: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en"); // Default: English

  useEffect(() => {
    const googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "fr,en",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
      }
    };

    const addGoogleTranslateScript = () => {
      if (!document.querySelector("#google-translate-script")) {
        const script = document.createElement("script");
        script.id = "google-translate-script";
        script.type = "text/javascript";
        script.async = true;
        script.src =
          "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";

        script.onload = () => googleTranslateElementInit();
        document.body.appendChild(script);
        window.googleTranslateElementInit = googleTranslateElementInit;
      } else {
        if (window.google && window.google.translate) {
          googleTranslateElementInit();
        }
      }
    };

    addGoogleTranslateScript();

    return () => {};
  }, []);

  // Function to manually trigger language change
  const changeLanguage = (lang: string) => {
    setSelectedLanguage(lang);

    const selectField = document.querySelector(
      "select.goog-te-combo"
    ) as HTMLSelectElement;
    if (selectField) {
      selectField.value = lang;
      selectField.dispatchEvent(new Event("change", { bubbles: true }));

      // Set default language to English if selected
    if (lang === "en") {
      setSelectedLanguage("en");
    }
    }
  };

  return (
    <div>
      <div id="google_translate_element"></div>
      
      {/* Custom Language Selector */}
      <select
        value={selectedLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
      >
        <option value="fr">French</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};

export default GoogleTranslate;