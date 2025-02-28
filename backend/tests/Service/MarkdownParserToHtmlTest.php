<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\MarkdownParserToHtml;
use PHPUnit\Framework\TestCase;

class MarkdownParserToHtmlTest extends TestCase
{
    private MarkdownParserToHtml $parser;

    protected function setUp(): void
    {
        $this->parser = new MarkdownParserToHtml();
    }

    public function testParsesBasicMarkdown(): void
    {
        $markdown = "# Heading\n\n## Subheading\n\nSome **bold** text.";
        $expectedHtml = "<h1>Heading</h1>\n<h2>Subheading</h2>\n<p>Some <strong>bold</strong> text.</p>\n";

        $this->assertEquals($expectedHtml, $this->parser->parse($markdown));
    }

    public function testEscapesRawHtml(): void
    {
        $markdown = "<script>alert('XSS');</script>";
        $parsedHtml = $this->parser->parse($markdown);

        $this->assertStringNotContainsString('<script>', $parsedHtml);
        $this->assertStringContainsString('&lt;script&gt;', $parsedHtml); // Should be escaped
    }

    public function testDisallowsUnsafeLinks(): void
    {
        $markdown = "[Evil Link](javascript:alert('XSS'))";
        $parsedHtml = $this->parser->parse($markdown);

        $this->assertStringNotContainsString('href="javascript:', $parsedHtml);
    }
}
