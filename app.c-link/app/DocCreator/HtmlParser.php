<?php

namespace App\DocCreator;

use App\Models\Util;

class HtmlParser
{

    public const SHORTCODE_SEPARATORS = [
        'start' => "{",
        'end' => "}",
    ];

    public const TAG_SEPARATOR = ":";

    protected static $tags = [
        'b' => [
            'start' => '<strong>',
            'end' => '</strong>'
        ],
        'bred' => [
            'start' => '<strong class="red">',
            'end' => '</strong>'
        ],
        'bpnk' => [
            'start' => '<strong class="pink">',
            'end' => '</strong>'
        ],
        'u' => [
            'start' => '<u>',
            'end' => '</u>'
        ],
        'i' => [
            'start' => '<i>',
            'end' => '</i>'
        ],
        'del' => [
            'start' => '<del>',
            'end' => '</del>'
        ],
        'br' => [
            'start' => '<br>',
            'end' => ''
        ],
        'trow' => [
            'start' => '<p>',
            'end' => '</p>'
        ],
        'em' => [
            'start' => '<em>',
            'end' => '</em>'
        ],
        'mark' => [
            'start' => '<div class="mark">',
            'end' => '</div>'
        ],
        'hr' => [
            'start' => '<hr>',
            'end' => ''
        ],
        'hrt' => [
            'start' => '<hr class="hrt" data-content="',
            'end' => '" />'
        ],
        "ul" => [
            'start' => '<ul>',
            'end' => '</ul>'
        ],
        "ol" => [
            'start' => '<ol>',
            'end' => '</ol>'
        ],
        "li" => [
            'start' => '<li>',
            'end' => '</li>'
        ],
        "lind" => [
            'start' => '<div class="ql-indent-1">',
            'end' => '</div>'
        ],
        "lnd2" => [
            'start' => '<div class="ql-indent-2">',
            'end' => '</div>'
        ],
        "lnd3" => [
            'start' => '<div class="ql-indent-3">',
            'end' => '</div>'
        ],
        "lnd4" => [
            'start' => '<div class="ql-indent-4">',
            'end' => '</div>'
        ],
        "lnd5" => [
            'start' => '<div class="ql-indent-5">',
            'end' => '</div>'
        ],
        "lnd6" => [
            'start' => '<div class="ql-indent-6">',
            'end' => '</div>'
        ],
        "lnd7" => [
            'start' => '<div class="ql-indent-7">',
            'end' => '</div>'
        ],
        "lnd8" => [
            'start' => '<div class="ql-indent-8">',
            'end' => '</div>'
        ],
        "binv" => [
            'start' => '<span style="border-bottom: 1px solid #000000;color:#FFFFFF" class="invisible-signatory">',
            'end' => '</span>'
        ],
        "inv" => [
            'start' => '<span style="color:#FFFFFF" class="invisible-signatory">',
            'end' => '</span>'
        ],
        "gp" => [
            'start' => '&nbsp;',
            'end' => ''
        ],
    ];

    protected static $specialTags = [
        "lind"
    ];

    /**
     * @return string[][]
     */
    public static function getTags(): array
    {
        return self::$tags;
    }

    /**
     * @return array
     */
    public static function getSpecialTags(): array
    {
        return self::$specialTags;
    }

    /**
     * @param array $data
     * @return false|float|int|mixed|\Services_JSON_Error|string|void
     */
    public static function parseHeader(array $data)
    {
        $header = [
            'logo' => $data['account']->getLogo(),
            'company_name' => $data['account']->getData("name"),
            'address' => $data['account']->getData("address"),
            'company_reg' => $data['account']->getData("reg_number"),
            'web_address' => [
                'label' => $data['account']->getData("website"),
                'href' => Util::addUrlScheme($data['account']->getData("website", ""))
            ],
        ];

        if (isset($data['content'])) {
            foreach ($data['content'] as &$value) {
                if (isset($value['header'])) {
                    foreach ($value['header'] as $k => &$v) {
                        if ($k !== "html") {
                            $v = $header[$k] ?? '';
                        }
                    }
                }
            }
        }
        unset($value, $v);

        return json_encode($data['content']);
    }

    /**
     * @param DocCreator $docCreator
     * @return false|float|int|mixed|\Services_JSON_Error|string|void
     * @throws \Exception
     */
    public static function parseFooter(DocCreator $docCreator)
    {
        $data = $docCreator->getShortcode()->getModels();
        $content = json_decode($docCreator->getContent(), true);

        $footer_label = $docCreator->getFooterLabel();

        //If we have attachments we dont need to set up the footer here
        //the footer will be added after we merge the attachments
        if ($docCreator->getOption("attachments")) {
            return json_encode($content);
        }

        $footer = [
            'company_name' => $data['account']->getData("name"),
            'subcontract' => $footer_label,
        ];

        if (isset($content) && is_array($content)) {
            foreach ($content as &$value) {
                if (isset($value['footer'])) {
                    foreach ($value['footer'] as $k => &$v) {
                        //we will parse the footer html outside of this function
                        //this will be handle by the pdf render
                        if ($k !== "html") {
                            $v = $footer[$k] ?? '';
                        }
                    }
                }
            }
            $value['footer']['page_nr'] = $docCreator->getOption("pageNr");
        }
        unset($value, $v);

        return json_encode($content);
    }

    /**
     * @param array $content
     * @return array
     */
    public static function parseAllTags(array $content): array
    {
        foreach ($content as $i => $row) {
            if (is_array($row) && isset($row['children'])) {
                $content[$i]['children'] = self::parseAllTags($row['children']);
            } else {
                if (is_scalar($row)) {
                    $textWithLinks = self::convertUrlsAndEmailsToLinks((string)$row);
                    $content[$i] = self::parseTags($textWithLinks);
                }
            }
        }
        return $content;
    }

    /**
     * @param string $content
     * @return string|string[]
     */
    public static function parseTags(string $content)
    {
        //First we take all the short codes out and replace them with tokens as it messes
        //with our regex for html tags
        $codes = [];
        preg_match_all("/{[\w]+}/", $content, $results);
        foreach ($results[0] as $match) {
            $id = uniqid();
            $content = str_replace($match, $id, $content);
            $codes[$id] = $match;
        }

        //Start with the inner most tag and work way out replacing the html short codes as we go
        // We may need to take into account other chars inside the content such as .? a good way to do this would be to match
        // all chars except } then we only ever get the internals. To make this stronger all we need to do is make sure that the text doesnt have random
        // } as that would break this implementation
        $content = self::parseSpecialTags($content);
        while (preg_match("/{(?<tag>[\w]{1,5}):(?<content>[^{}]+)}/", $content, $match)) {
            $content = str_replace($match[0], self::getTag($match["tag"], $match["content"]), $content);
        }
        // Now er need to put the short codes back in again
        foreach ($codes as $id => $code) {
            $content = str_replace($id, $code, $content);
        }

        return $content;
    }

    /**
     * @param string $content
     * @return string
     */
    public static function parseSpecialTags(string $content): string
    {
        foreach (self::getSpecialTags() as $tag) {
            preg_match_all('/{' . $tag . '(.*?)}/', $content, $matches);
            if (!empty($matches[0])) {
                switch ($tag) {
                    case 'lind':
                        $content = self::setNestedList($matches[0], $content);
                        break;
                }
            }
        }
        return $content;
    }

    /**
     * @param array $matches
     * @param string $content
     * @return string
     */
    public static function setNestedList(array $matches, string $content): string
    {
        $marginList = str_repeat("&nbsp;", 8);
        foreach ($matches as $index => $match) {
            $letterIndex = strtolower(self::getLetterByPosition($index));
            $newMatch = substr_replace($match, $marginList . $letterIndex . ". ", strpos($match, ":") + 1, 0);
            $content = str_replace($match, $newMatch, $content);
        }
        return $content;
    }

    public static function getLetterByPosition(int $index)
    {
        $alphabet = range('A', 'Z');
        return !empty($alphabet[$index]) ? $alphabet[$index] : NULL;
    }

    /**
     * @param string $symbol
     * @param string $content
     * @return string
     */
    public static function getTag(string $symbol, string $content): string
    {
        $tags = self::getTags();
        $tag = $tags[$symbol] ?? "";
        if (!$tag) {
            throw new \Exception("Missing HtmlTag $symbol");
        }

        return sprintf("%s%s%s", $tag['start'], $content, $tag['end']);
    }

    /**
     * @param string $content
     * @return string
     */
    public static function parseOuterTags(string $content): string
    {
        $tags = self::getTags();
        // process in a single pass to avoid materialising all matches in memory
        $content = preg_replace_callback(
            '/{([^{}]+)}/',
            static function ($match) use ($tags) {
                $parts = explode(self::TAG_SEPARATOR, $match[1]);
                $tag = $parts[0] ?? '';

                // {br:1} and {br} should render the same html; invalid/unknown tags stay untouched
                $count = $parts[1] ?? 1;

                if (!isset($tags[$tag]) || !is_numeric($count) || (int)$count <= 0) {
                    return $match[0];
                }

                // guard against pathological counts that could exhaust memory
                $count = min((int)$count, 10000);

                return str_repeat($tags[$tag]['start'] . $tags[$tag]['end'], $count);
            },
            $content
        );

        return (is_scalar($content)) ? $content : '';
    }

    /**
     * @param string $text
     * @return string
     */
    public static function convertUrlsAndEmailsToLinks(string $text): string
    {
        if ($text === '') {
            return $text;
        }

        $pattern = '~(?<!href=\'|href="|src=\'|src=")(?:(?:https?://|ftp://|www\.)[^\s\{\}<]+|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4})~i';

        return preg_replace_callback($pattern, function ($matches) {
            $value = $matches[0];
            $displayValue = html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $trimmedValue = rtrim($displayValue, ".,:;!?)]}\"'");
            $suffix = substr($displayValue, strlen($trimmedValue));

            if (filter_var($trimmedValue, FILTER_VALIDATE_EMAIL)) {
                $href = 'mailto:' . $trimmedValue;
                $rel = '';
                $target = '';
            } else {
                $href = $trimmedValue;
                if (stripos($href, 'www.') === 0) {
                    $href = 'http://' . $href;
                }
                $rel = ' rel="noopener noreferrer"';
                $target = ' target="_blank"';
            }

            $safeHref = htmlspecialchars($href, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $safeDisplay = htmlspecialchars($trimmedValue, ENT_QUOTES | ENT_HTML5, 'UTF-8');

            return '<a href="' . $safeHref . '"' . $rel . $target . '>'
                . $safeDisplay
                . '</a>'
                . $suffix;
        }, $text);
    }
}
