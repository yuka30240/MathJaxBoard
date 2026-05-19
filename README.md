# MathJax Board

A browser-based LaTeX formula tool that allows you to create, preview, export, and share mathematical expressions as SVG, PNG, or Unicode text.

## Live Demo

**[https://yuka30240.github.io/MathJaxBoard/](https://yuka30240.github.io/MathJaxBoard/)**

## Features

- LaTeX mathematical notation support via MathJax
- Live Preview
- Export as SVG or PNG format
- Instantly copy the rendered formula into the clipboard to paste into documents
- Save the rendered formula as a file (formula.svg or formula.png)
- Convert LaTeX formulas to Unicode Text for SNS, chat, and other plain-text places

### SVG and PNG Export

MathJax Board exports rendered formulas as SVG or PNG for use in documents, slides, and other applications.

On supported platforms, such as Windows with Chrome or Edge, SVG clipboard export lets you paste scalable formulas directly into Microsoft Office documents. When SVG clipboard export is not available, PNG clipboard export provides a broadly compatible image-based fallback.

If clipboard transfer is limited or unavailable on your platform, use the Download button to save the formula as an SVG or PNG file and import it into another application.

### Unicode Text

The Unicode Text feature converts a LaTeX formula into a plain Unicode representation, so you can communicate formulas in environments that do not support MathJax, KaTeX, SVG, or image embedding. This is useful for SNS posts, chat messages, and other text-first platforms.

Because Unicode Text is still plain text, some LaTeX constructs may be approximated or preserved when there is no suitable Unicode equivalent. 

## Browser Compatibility Note

The "Copy to Clipboard" functionality, particularly for SVG exports, may not work properly on some web browsers or devices due to browser limitations or security restrictions. 

## Deployment

MathJax Board is a static web application that can be deployed on any web server capable of serving HTML, CSS, and JavaScript files.

To deploy the application, serve the contents of the docs/ directory as static files.
