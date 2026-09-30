import htmlParser, { MAX_HTML_TAG_OPT_SIZE } from './htmlParser';

function getContent(content) {
  // Base case: no content or empty
  if (!content) {
    return [content];
  }
  const hasBrackets = content.indexOf('{');
  // Base case: no Brackets in the string
  if (hasBrackets < 0) {
    return [content];
  }
  // Bracket later
  if (hasBrackets > 0) {
    const firstContent = content.slice(0, hasBrackets);
    const secondContent = content.slice(hasBrackets);
    return [firstContent, ...getContent(secondContent)];
  }
  // From here, we know the position 0 is an open bracket. First, we check the last Bracket from behind
  let lastEndBracket = content.indexOf('}');
  // Bracket ending it's not the last. We return that content
  if (lastEndBracket !== content.length - 1) {
    // We slice the content till the first close bracket
    let firstContent = content.slice(0, lastEndBracket + 1);
    while (
      (firstContent.match(/{/g) || []).length !==
      (firstContent.match(/}/g) || []).length
    ) {
      lastEndBracket = content.indexOf('}', lastEndBracket + 1);
      firstContent = content.slice(0, lastEndBracket + 1);
    }
    const secondContent = content.slice(lastEndBracket + 1);

    // edge case found for multiple <br /> tags. This will solve it
    if (firstContent === '{br}') {
      return [htmlParser.br(), ...getContent(secondContent)];
    }
    // edge case found for multiple <gp /> tags. This will solve it
    if (firstContent === '{gp}') {
      return [htmlParser.gp(), ...getContent(secondContent)];
    }

    // We apply a style if last break for first content is equal to length
    if (firstContent.length - 1 === lastEndBracket) {
      const htmlTag = firstContent.slice(1, firstContent.indexOf(':'));
      let insideContent = firstContent.slice(
        firstContent.indexOf(':') + 1,
        firstContent.length - 1,
      );
      if (!htmlParser[htmlTag]) {
        insideContent = firstContent;
      }
      return [
        (htmlParser[htmlTag] &&
          htmlParser[htmlTag](getContent(insideContent))) ||
          insideContent,
        ...getContent(secondContent),
      ];
    }
    return [...getContent(firstContent), ...getContent(secondContent)];
  }
  // At this point, we do know we have { at the beginning and } at the end
  // We could encounter 3 situations: embedded Brackets or multiple ones
  // Ex1: const content = "{em:{u:Tender to}}"
  // Ex2: const content = "{em:to} {em:Tender}"
  // Ex3: const content = "{em:to Tender}"
  const endBracket = content.indexOf('}');
  // Ex3
  if (endBracket === content.length - 1) {
    const sliceContent = content.slice(1, MAX_HTML_TAG_OPT_SIZE);
    // Or it's a regular shortcode, or its the BR tag
    if (!sliceContent.includes(':')) {
      const contentNoBrackets = content.slice(1, content.length - 1);
      return (
        (htmlParser[contentNoBrackets] && [
          htmlParser[contentNoBrackets](),
        ]) || [content]
      );
    }
    // else, it has an HTML tag
    const htmlTag = content.slice(1, content.indexOf(':'));
    const insideContent = content.slice(
      content.indexOf(':') + 1,
      content.length - 1,
    );
    return [htmlParser[htmlTag](insideContent)];
  }
  const startBracket = content.indexOf('{', 1);
  // startBracket < endBracket = Ex1
  if (startBracket < endBracket) {
    const htmlTag = content.slice(1, content.indexOf(':'));
    const insideContent = content.slice(
      content.indexOf(':') + 1,
      content.length - 1,
    );
    return [htmlParser[htmlTag](...getContent(insideContent))];
  }
  // startBracket > endBracket = Ex2
  const toAnalize = content.slice(0, endBracket + 1);
  const toReturn = content.slice(endBracket + 1);

  return [...getContent(toAnalize), ...getContent(toReturn)];
}

export default getContent;
