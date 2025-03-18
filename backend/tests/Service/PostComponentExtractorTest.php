<?php declare(strict_types=1);

namespace App\Tests\Service;

use App\Service\PostComponentExtractor;
use PHPUnit\Framework\TestCase;

class PostComponentExtractorTest extends TestCase
{
    public function testExtractComponentIds()
    {
        $extractor = new PostComponentExtractor();

        $jsonBody = [
            "root" => [
                "children" => [
                    [
                        "children" => [
                            [
                                "type" => "custom_mention",
                                "idForComponent" => "123e4567-e89b-12d3-a456-426614174000"
                            ],
                            [
                                "type" => "custom_mention",
                                "idForComponent" => "123e4567-e89b-12d3-a456-426614174001"
                            ]
                        ]
                    ]
                ]
            ]
        ];

        $result = $extractor->extractComponentIds($jsonBody);

        $this->assertSame([
            "123e4567-e89b-12d3-a456-426614174000",
            "123e4567-e89b-12d3-a456-426614174001"
        ], $result);
    }

    public function testExtractComponentIdsHandlesNestedStructures()
    {
        $extractor = new PostComponentExtractor();

        $jsonBody = [
            "root" => [
                "children" => [
                    [
                        "type" => "custom_mention",
                        "idForComponent" => "123e4567-e89b-12d3-a456-426614174002"
                    ],
                    [
                        "type" => "paragraph",
                        "children" => [
                            [
                                "type" => "custom_mention",
                                "idForComponent" => "123e4567-e89b-12d3-a456-426614174003"
                            ]
                        ]
                    ]
                ]
            ]
        ];

        $result = $extractor->extractComponentIds($jsonBody);

        $this->assertSame([
            "123e4567-e89b-12d3-a456-426614174002",
            "123e4567-e89b-12d3-a456-426614174003"
        ], $result);
    }

    public function testExtractComponentIdsHandlesEmptyInput()
    {
        $extractor = new PostComponentExtractor();

        $jsonBody = [];

        $result = $extractor->extractComponentIds($jsonBody);

        $this->assertSame([], $result);
    }
}
