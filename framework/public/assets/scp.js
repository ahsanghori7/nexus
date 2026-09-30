(function () {
  const getStarted = () => {
    document.getElementById("sign-up-form-container").style.display = "block";
    document.getElementById("supply-chain-welcome-container").style.display =
      "none";
  };

  const getAccountLogo = (idHash) => {
    const source = `account/logo/${idHash}/logo.png`;
    const currentDate = new Date();
    return `${source}?current=${currentDate.getTime()}`;
  };

  document
    .getElementById("get-started-btn")
    .addEventListener("click", getStarted);

  const idHash = document.getElementById("id-company-hash").value;
  const s3UrlSource = document.getElementById("s3-url-source").value;
  document.getElementById("sp-company-logo").src =
    s3UrlSource + getAccountLogo(idHash);
})();
