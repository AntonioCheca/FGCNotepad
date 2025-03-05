<?php declare(strict_types=1);

namespace App\Service;

use ElGigi\CommonMarkEmoji\EmojiExtension;
use League\CommonMark\CommonMarkConverter;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\DisallowedRawHtml\DisallowedRawHtmlExtension;
use League\CommonMark\MarkdownConverter;
use Zoon\CommonMark\Ext\YouTubeIframe\YouTubeIframeExtension;

class MarkdownParserToHtml
{
    private MarkdownConverter $converter;

    public function __construct()
    {
        $config = [
            'html_input' => 'escape', // Escapes raw HTML to prevent XSS
            'allow_unsafe_links' => false, // Disallows `javascript:`, `data:` links for security
            'youtube_iframe' => [
                'width' => '600',
                'height' => '300',
                'allow_full_screen' => true,
            ],
        ];

        $environment = new Environment($config);
        $environment->addExtension(new CommonMarkCoreExtension());
        $environment->addExtension(new DisallowedRawHtmlExtension());
        $environment->addExtension(new EmojiExtension());
        $environment->addExtension(new YouTubeIframeExtension());

        $this->converter = new MarkdownConverter($environment);
    }

    public function parse(string $markdown): string
    {
        return $this->converter->convert($markdown)->getContent();
    }
}
