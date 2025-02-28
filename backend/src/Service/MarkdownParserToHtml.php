<?php declare(strict_types=1);

namespace App\Service;

use League\CommonMark\CommonMarkConverter;
use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\DisallowedRawHtml\DisallowedRawHtmlExtension;
use League\CommonMark\MarkdownConverter;
use League\CommonMark\MarkdownConverterInterface;

class MarkdownParserToHtml
{
    private MarkdownConverterInterface $converter;

    public function __construct()
    {
        $config = [
            'html_input' => 'escape', // Escapes raw HTML to prevent XSS
            'allow_unsafe_links' => false, // Disallows `javascript:`, `data:` links for security
        ];

        $environment = new Environment($config);
        $environment->addExtension(new CommonMarkCoreExtension());
        $environment->addExtension(new DisallowedRawHtmlExtension()); // Prevent raw HTML

        $this->converter = new MarkdownConverter($environment);
    }

    public function parse(string $markdown): string
    {
        return $this->converter->convert($markdown)->getContent();
    }
}
