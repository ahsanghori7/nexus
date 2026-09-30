import Quill from 'quill';

const Delta = Quill.import('delta');

/**
 * Processes inline formatting in HTML content
 * @param {string} html - HTML content to process
 * @return {string} Processed content
 */
function processInlineFormatting(html) {
  // For simplicity, just strip all HTML tags for now
  // In a production environment, you'd want to convert these to Delta formats
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Extracts the indentation level from a list item element
 * @param {string} liString - HTML string of the list item
 * @return {number} - Indentation level (0-based)
 */
function getIndentLevel(liString) {
  // Check for class-based indentation (common in Quill)
  const indentClassMatch = liString.match(/class="[^"]*ql-indent-(\d+)[^"]*"/);
  if (indentClassMatch && indentClassMatch[1]) {
    return parseInt(indentClassMatch[1], 10);
  }

  // Check for style-based indentation
  const marginLeftMatch = liString.match(
    /style="[^"]*margin-left:\s*(\d+)([a-z]+)[^"]*"/
  );
  if (marginLeftMatch && marginLeftMatch[1]) {
    const value = parseInt(marginLeftMatch[1], 10);
    const unit = marginLeftMatch[2];

    // Convert common units to indent levels (approximate)
    if (unit === 'em' || unit === 'rem') {
      return Math.floor(value / 2); // Assuming 2em per indent level
      // eslint-disable-next-line no-else-return
    } else if (unit === 'px') {
      return Math.floor(value / 40); // Assuming 40px per indent level
    }
  }

  // Check for data-indent attribute
  const dataIndentMatch = liString.match(/data-indent="(\d+)"/);
  if (dataIndentMatch && dataIndentMatch[1]) {
    return parseInt(dataIndentMatch[1], 10);
  }

  // Check for padding-left or text-indent in style
  const paddingMatch = liString.match(
    /style="[^"]*padding-left:\s*(\d+)([a-z]+)[^"]*"/
  );
  if (paddingMatch && paddingMatch[1]) {
    const value = parseInt(paddingMatch[1], 10);
    const unit = paddingMatch[2];

    if (unit === 'em' || unit === 'rem') {
      return Math.floor(value / 2);
      // eslint-disable-next-line no-else-return
    } else if (unit === 'px') {
      return Math.floor(value / 40);
    }
  }

  return 0; // Default: no indentation
}

/**
 * Converts HTML string to a Quill Delta object
 * @param {string} html - HTML string to convert
 * @return {Delta} Quill Delta object
 */
export function htmlToDelta(html) {
  // Use regex-based parsing to handle the conversion without requiring DOM
  const delta = new Delta();

  // Process ordered lists
  if (html.includes('<ol')) {
    // Extract list items from ordered list
    const olRegex = /<ol[^>]*>(.*?)<\/ol>/gs;
    let olMatch;

    // eslint-disable-next-line no-cond-assign
    while ((olMatch = olRegex.exec(html)) !== null) {
      const listContent = olMatch[1];
      const liRegex = /<li[^>]*>(.*?)<\/li>/gs;
      let liMatch;

      // eslint-disable-next-line no-cond-assign
      while ((liMatch = liRegex.exec(listContent)) !== null) {
        let content = liMatch[1];
        const fullLiTag = liMatch[0]; // The complete <li> tag

        // Get indentation level
        const indentLevel = getIndentLevel(fullLiTag);

        // Remove the ql-ui span
        content = content.replace(/<span class="ql-ui"[^>]*><\/span>/g, '');

        // Check if the content contains nested lists
        const hasNestedList =
          content.includes('<ol') || content.includes('<ul');

        if (hasNestedList) {
          // If there's text before the nested list, extract and insert it
          const textBeforeList = content.split(/<[ou]l/)[0];
          if (textBeforeList.trim()) {
            delta.insert(processInlineFormatting(textBeforeList.trim()));
            delta.insert('\n', {
              list: 'ordered',
              indent: indentLevel,
            });
          }

          // We'll handle nested lists in the DOM parsing version
          // This regex approach has limitations for complex nesting
        } else {
          // Regular content without nested lists
          content = processInlineFormatting(content);

          if (content.trim()) {
            delta.insert(content.trim());
          }

          // Add indent attribute if needed
          const attributes = { list: 'ordered' };
          if (indentLevel > 0) {
            attributes.indent = indentLevel;
          }

          delta.insert('\n', attributes);
        }
      }
    }
  }

  // Process unordered lists
  if (html.includes('<ul')) {
    // Extract list items from unordered list
    const ulRegex = /<ul[^>]*>(.*?)<\/ul>/gs;
    let ulMatch;

    // eslint-disable-next-line no-cond-assign
    while ((ulMatch = ulRegex.exec(html)) !== null) {
      const listContent = ulMatch[1];
      const liRegex = /<li[^>]*>(.*?)<\/li>/gs;
      let liMatch;

      // eslint-disable-next-line no-cond-assign
      while ((liMatch = liRegex.exec(listContent)) !== null) {
        let content = liMatch[1];
        const fullLiTag = liMatch[0]; // The complete <li> tag

        // Get indentation level
        const indentLevel = getIndentLevel(fullLiTag);

        // Remove the ql-ui span
        content = content.replace(/<span class="ql-ui"[^>]*><\/span>/g, '');

        // Check if the content contains nested lists
        const hasNestedList =
          content.includes('<ol') || content.includes('<ul');

        if (hasNestedList) {
          // If there's text before the nested list, extract and insert it
          const textBeforeList = content.split(/<[ou]l/)[0];
          if (textBeforeList.trim()) {
            delta.insert(processInlineFormatting(textBeforeList.trim()));
            delta.insert('\n', {
              list: 'bullet',
              indent: indentLevel,
            });
          }

          // We'll handle nested lists in the DOM parsing version
          // This regex approach has limitations for complex nesting
        } else {
          // Regular content without nested lists
          content = processInlineFormatting(content);

          if (content.trim()) {
            delta.insert(content.trim());
          }

          // Add indent attribute if needed
          const attributes = { list: 'bullet' };
          if (indentLevel > 0) {
            attributes.indent = indentLevel;
          }

          delta.insert('\n', attributes);
        }
      }
    }
  }

  // Process paragraphs
  const pRegex = /<p[^>]*>(.*?)<\/p>/gs;
  let pMatch;

  // eslint-disable-next-line no-cond-assign
  while ((pMatch = pRegex.exec(html)) !== null) {
    let content = pMatch[1];
    const fullPTag = pMatch[0]; // The complete <p> tag

    // Get indentation level for paragraph
    const indentLevel = getIndentLevel(fullPTag);

    // Handle empty paragraphs or paragraphs with just a <br> tag
    if (
      content === '<br>' ||
      content === '<br/>' ||
      content === '<br />' ||
      content.trim() === ''
    ) {
      const attributes = indentLevel > 0 ? { indent: indentLevel } : {};
      delta.insert('\n', attributes);
    } else {
      // Process formatting inside paragraph
      content = processInlineFormatting(content);

      if (content.trim()) {
        delta.insert(content.trim());
      }

      const attributes = indentLevel > 0 ? { indent: indentLevel } : {};
      delta.insert('\n', attributes);
    }
  }

  // Process headings
  for (let i = 1; i <= 6; i++) {
    // eslint-disable-next-line no-useless-escape
    const hRegex = new RegExp(`<h${i}[^>]*>(.*?)<\/h${i}>`, 'gs');
    let hMatch;

    // eslint-disable-next-line no-cond-assign
    while ((hMatch = hRegex.exec(html)) !== null) {
      let content = hMatch[1];
      const fullHTag = hMatch[0]; // The complete <h> tag

      // Get indentation level
      const indentLevel = getIndentLevel(fullHTag);

      content = processInlineFormatting(content);

      delta.insert(content.trim());

      const attributes = { header: i };
      if (indentLevel > 0) {
        attributes.indent = indentLevel;
      }

      delta.insert('\n', attributes);
    }
  }

  // Process individual <br> tags that aren't in paragraphs
  const brRegex = /(?:<p[^>]*>)?<br\s*\/?>\s*(?:<\/p>)?/g;
  let brMatch;
  // eslint-disable-next-line no-cond-assign
  while ((brMatch = brRegex.exec(html)) !== null) {
    // Skip if this <br> is inside a <p> tag that we've already processed
    if (brMatch[0].includes('<p') && brMatch[0].includes('</p>')) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // Add a line break for standalone <br> tags
    delta.insert('\n');
  }

  return delta;
}

/**
 * Process a DOM node and its children
 * @param {Node} node - DOM node
 * @param {Delta} delta - Delta object to append to
 * @param {Object} format - Current format attributes
 * @param {number} indentLevel - Current indent level
 */
function processNode(node, delta, format, indentLevel = 0) {
  if (!node) return;

  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent.trim()) {
      delta.insert(
        node.textContent,
        Object.keys(format).length > 0 ? format : undefined
      );
    }
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  // Skip Quill UI elements
  if (node.classList && node.classList.contains('ql-ui')) {
    return;
  }

  // Clone the format object to avoid modifying the parent's format
  const newFormat = { ...format };

  // Get current node's indent level
  let currentIndentLevel = indentLevel;

  // Check for class-based indentation
  if (node.classList) {
    for (const className of node.classList) {
      if (className.startsWith('ql-indent-')) {
        currentIndentLevel = parseInt(className.replace('ql-indent-', ''), 10);
        break;
      }
    }
  }

  // Check for style-based indentation
  if (node.style && node.style.marginLeft) {
    const marginLeftValue = parseInt(node.style.marginLeft, 10);
    if (!isNaN(marginLeftValue)) {
      // Convert px to indent level (approximate)
      currentIndentLevel = Math.max(
        currentIndentLevel,
        Math.floor(marginLeftValue / 40)
      );
    }
  }

  // Handle BR tags directly
  if (node.nodeName.toLowerCase() === 'br') {
    delta.insert('\n');
    return;
  }

  // Apply formatting based on element type
  // eslint-disable-next-line default-case
  switch (node.nodeName.toLowerCase()) {
    case 'b':
    case 'strong':
      newFormat.bold = true;
      break;
    case 'i':
    case 'em':
      newFormat.italic = true;
      break;
    case 'u':
      newFormat.underline = true;
      break;
    case 's':
    case 'strike':
      newFormat.strike = true;
      break;
    case 'a':
      newFormat.link = node.getAttribute('href') || '';
      break;
    // Add other formats as needed
  }

  // Special handling for list structures
  if (
    node.nodeName.toLowerCase() === 'ol' ||
    node.nodeName.toLowerCase() === 'ul'
  ) {
    const listType =
      node.nodeName.toLowerCase() === 'ol' ? 'ordered' : 'bullet';

    // Process all list items
    Array.from(node.childNodes).forEach((child) => {
      if (
        child.nodeType === Node.ELEMENT_NODE &&
        child.nodeName.toLowerCase() === 'li'
      ) {
        // Check for additional indentation on the li itself
        let liIndentLevel = currentIndentLevel;

        if (child.classList) {
          for (const className of child.classList) {
            if (className.startsWith('ql-indent-')) {
              liIndentLevel = parseInt(className.replace('ql-indent-', ''), 10);
              break;
            }
          }
        }

        // Process li content
        let hasNestedList = false;
        let hasTextContent = false;

        // First process text content
        for (const liChild of child.childNodes) {
          if (liChild.nodeType === Node.TEXT_NODE) {
            if (liChild.textContent.trim()) {
              hasTextContent = true;
              delta.insert(
                liChild.textContent,
                Object.keys(newFormat).length > 0 ? newFormat : undefined
              );
            }
          } else if (liChild.nodeType === Node.ELEMENT_NODE) {
            if (
              liChild.nodeName.toLowerCase() === 'ol' ||
              liChild.nodeName.toLowerCase() === 'ul'
            ) {
              // eslint-disable-next-line no-unused-vars
              hasNestedList = true;
            } else if (
              liChild.nodeName.toLowerCase() !== 'span' ||
              !liChild.classList ||
              !liChild.classList.contains('ql-ui')
            ) {
              // Handle <br> in list items
              if (liChild.nodeName.toLowerCase() === 'br') {
                delta.insert('\n', {
                  list: listType,
                  indent: liIndentLevel,
                });
                // eslint-disable-next-line no-continue
                continue;
              }

              // Process non-list elements that aren't ql-ui spans
              processNode(liChild, delta, newFormat, liIndentLevel);
              if (liChild.textContent.trim()) {
                // eslint-disable-next-line no-unused-vars
                hasTextContent = true;
              }
            }
          }
        }

        // Always add a newline for the list item, even if it was empty
        // This ensures proper list structure in the Delta
        const attributes = { list: listType };
        if (liIndentLevel > 0) {
          attributes.indent = liIndentLevel;
        }
        delta.insert('\n', attributes);

        // Then process any nested lists with increased indentation
        for (const liChild of child.childNodes) {
          if (
            liChild.nodeType === Node.ELEMENT_NODE &&
            (liChild.nodeName.toLowerCase() === 'ol' ||
              liChild.nodeName.toLowerCase() === 'ul')
          ) {
            // Process nested list with increased indentation
            processNode(liChild, delta, newFormat, liIndentLevel + 1);
          }
        }
      }
    });

    return; // Skip default child processing for lists
  }

  // Special handling for paragraphs
  if (node.nodeName.toLowerCase() === 'p') {
    // Check if paragraph is empty or contains only a BR
    const isEmpty =
      node.childNodes.length === 0 ||
      (node.childNodes.length === 1 &&
        node.childNodes[0].nodeName.toLowerCase() === 'br');

    if (isEmpty) {
      // Handle empty paragraph
      const attributes =
        currentIndentLevel > 0 ? { indent: currentIndentLevel } : {};
      delta.insert('\n', attributes);
      return;
    }

    // Process normal paragraph content
    for (const child of node.childNodes) {
      processNode(child, delta, newFormat, currentIndentLevel);
    }

    // Add the paragraph ending newline
    const attributes =
      currentIndentLevel > 0 ? { indent: currentIndentLevel } : {};
    delta.insert('\n', attributes);
    return;
  }

  // Process child nodes with the new format
  for (const child of node.childNodes) {
    processNode(child, delta, newFormat, currentIndentLevel);
  }

  // Add appropriate newline with attributes for block elements
  // eslint-disable-next-line default-case
  switch (node.nodeName.toLowerCase()) {
    case 'h1':
      // eslint-disable-next-line no-case-declarations
      const h1Attributes = { header: 1 };
      if (currentIndentLevel > 0) h1Attributes.indent = currentIndentLevel;
      delta.insert('\n', h1Attributes);
      break;
    case 'h2':
      // eslint-disable-next-line no-case-declarations
      const h2Attributes = { header: 2 };
      if (currentIndentLevel > 0) h2Attributes.indent = currentIndentLevel;
      delta.insert('\n', h2Attributes);
      break;
    case 'h3':
      // eslint-disable-next-line no-case-declarations
      const h3Attributes = { header: 3 };
      if (currentIndentLevel > 0) h3Attributes.indent = currentIndentLevel;
      delta.insert('\n', h3Attributes);
      break;
    case 'h4':
      // eslint-disable-next-line no-case-declarations
      const h4Attributes = { header: 4 };
      if (currentIndentLevel > 0) h4Attributes.indent = currentIndentLevel;
      delta.insert('\n', h4Attributes);
      break;
    case 'h5':
      // eslint-disable-next-line no-case-declarations
      const h5Attributes = { header: 5 };
      if (currentIndentLevel > 0) h5Attributes.indent = currentIndentLevel;
      delta.insert('\n', h5Attributes);
      break;
    case 'h6':
      // eslint-disable-next-line no-case-declarations
      const h6Attributes = { header: 6 };
      if (currentIndentLevel > 0) h6Attributes.indent = currentIndentLevel;
      delta.insert('\n', h6Attributes);
      break;
    case 'div':
      // eslint-disable-next-line no-case-declarations
      const divAttributes =
        currentIndentLevel > 0 ? { indent: currentIndentLevel } : {};
      delta.insert('\n', divAttributes);
      break;
  }
}

/**
 * Converts a DOM node to a Delta object
 * @param {Node} node - DOM node
 * @return {Delta} Quill Delta object
 */
function domToDelta(node) {
  const delta = new Delta();

  // Process all child nodes
  for (const child of node.childNodes) {
    processNode(child, delta, {}, 0);
  }

  // If the delta ends without a newline, add one to ensure proper formatting
  if (
    delta.ops.length > 0 &&
    !(
      delta.ops[delta.ops.length - 1].insert === '\n' ||
      (typeof delta.ops[delta.ops.length - 1].insert === 'string' &&
        delta.ops[delta.ops.length - 1].insert.endsWith('\n'))
    )
  ) {
    delta.insert('\n');
  }

  return delta;
}

/**
 * Helper function to create a Delta object from the given HTML
 * with proper inline formatting and structure.
 *
 * This is a more complete implementation that handles complex HTML.
 *
 * @param {string} html - HTML string
 * @return {Delta} Quill Delta object
 */
export function parseHtmlToDelta(html) {
  // Parse HTML using a temporary element if in a browser environment
  // or regex-based approach for Node.js

  try {
    // Browser approach
    if (typeof document !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      return domToDelta(doc.body);
    }
    // Fallback to regex approach
    return htmlToDelta(html);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error parsing HTML to Delta:', error);
    // Fallback to regex approach
    return htmlToDelta(html);
  }
}
