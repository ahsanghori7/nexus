module.exports = {
  printError: function (title, error) {
    console.error(
      "\n",
      "================================================",
      "\n"
    );
    console.error(title, "\n");
    console.error(error);
    console.error(
      "\n",
      "================================================",
      "\n"
    );
  },
  hashCode: function(str) {
    let hash = 0, i, chr;
    for (i = 0; i < str.length; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
};
