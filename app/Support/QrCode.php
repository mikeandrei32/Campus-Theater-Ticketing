<?php

namespace App\Support;

use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\HtmlString;

class QrCode
{
    protected int $size = 150;

    public static function size(int $size): self
    {
        $instance = new static();
        $instance->size = $size;
        return $instance;
    }

    public function generate(string $text): HtmlString
    {
        $renderer = new ImageRenderer(
            new RendererStyle($this->size, 1),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($text);
        // Strip xml declaration if present for clean inline embedding
        $svg = preg_replace('/<\?xml[^\?]*\?>\s*/i', '', $svg);

        return new HtmlString($svg);
    }
}
