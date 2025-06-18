const DOM = {
    formulaInput: document.getElementById('texInput'),
    previewContainer: document.getElementById('preview'),
    btnClipboard: document.getElementById('btnClipboard'),
    btnDownload: document.getElementById('btnDownload'),
    btnExample: document.getElementById('btnExample'),
    scaleRange: document.getElementById('scaleRange'),
    scaleValue: document.getElementById('scaleValue'),
    exampleSelect: document.getElementById('exampleSelect'),
};

const CONFIG = {
    RENDER_DEBOUNCE_MS: 500,
    SCALE_MIN: 0.5,
    SCALE_MAX: 4,
    SCALE_DEFAULT: 1,
    NOTIFICATION_TIMEOUT: 3000,
    PNG_PADDING: 1
};

const examples = {
    euler: ["Euler's identity", `e^{i\\pi} + 1 = 0`],
    fourier: ["Fourier transform", `\\hat{f}(\\omega) = \\frac{1}{\\sqrt{2\\pi}}\\int_{-\\infty}^{\\infty} f(t)e^{-i\\omega t} \\mathrm{d}t`],
    gaussian: ["Gaussian integral", `\\int_{-\\infty}^{\\infty} e^{-x^2} \\mathrm{d}x = \\sqrt{\\pi}`],
    maxwell: ["Maxwell's equation", `\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}`],
    schrodinger: ["Schrödinger equation", `i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi`],
    wronskian: ["Wronskian determinant", `W(f_1,\\ldots,f_n)(x) = \n\\begin{vmatrix}\nf_1(x) & f_2(x) & \\cdots & f_n(x) \\\\\nf_1'(x) & f_2'(x) & \\cdots & f_n'(x) \\\\\n\\vdots & \\vdots & \\ddots & \\vdots \\\\\nf_1^{(n-1)}(x) & f_2^{(n-1)}(x) & \\cdots & f_n^{(n-1)}(x)\n\\end{vmatrix}`],
    amscd_demo: ["[Extension] amscd", `\\require{amscd}\n\\begin{CD}\nA @>a>> B\\\\\n@VVbV @VVcV\\\\\nC @>d>> D\n\\end{CD}`],
    colorv2_demo: ["[Extension] colorv2", `\\require{colorv2}\n\\nabla^2 u = \\frac{1}{\\color{red}{r}^2} \\frac{\\partial}{\\partial \\color{red}{r}} \\left( \\color{red}{\\color{red}{r}}^2 \\frac{\\partial u}{\\partial \\color{red}{r}} \\right) + \\frac{1}{\\color{red}{r}^2 \\sin\\color{blue}{\\theta}} \\frac{\\partial}{\\partial \\color{blue}{\\theta}} \\left( \\sin\\color{blue}{\\theta} \\frac{\\partial u}{\\partial \\color{blue}{\\theta}} \\right) + \\frac{1}{\\color{red}{r}^2 \\sin^2 \\color{blue}{\\theta}} \\frac{\\partial^2 u}{\\partial \\color{green}{\\phi}^2}`]
};

let renderDebounceTimer;

MathJax.startup.promise.then(() => {
    DOM.btnClipboard.addEventListener('click', () => handleExport('clipboard'));
    DOM.btnDownload.addEventListener('click', () => handleExport('download'));
    DOM.btnExample.addEventListener('click', loadSelectedExample);

    DOM.scaleRange.addEventListener('input', () => {
        DOM.scaleValue.textContent = parseFloat(DOM.scaleRange.value).toFixed(1);
    });

    DOM.formulaInput.addEventListener('input', () => {
        clearTimeout(renderDebounceTimer);
        renderDebounceTimer = setTimeout(renderPreview, CONFIG.RENDER_DEBOUNCE_MS);
    });

    DOM.exampleSelect.addEventListener('change', () => {
        DOM.btnExample.disabled = !DOM.exampleSelect.value;
    });

    populateExamples();
    renderPreview();
    updateButtonStates();
});

function handleExport(exportMode) {
    const format = document.querySelector('input[name="format"]:checked').value;
    if (format === 'svg') {
        exportSVG(exportMode);
    } else {
        exportPNG(exportMode);
    }
}

function populateExamples() {
    for (const [key, value] of Object.entries(examples)) {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value[0];
        DOM.exampleSelect.appendChild(option);
    }
}

function loadSelectedExample() {
    try {
        const key = DOM.exampleSelect.value;
        if (!key || !examples[key]) {
            showNotification('Please select an example from the dropdown', 'warning');
            return;
        }
        DOM.formulaInput.value = examples[key][1] || '';
        renderPreview();
    } catch (error) {
        console.error('Error loading example:', error);
        showNotification('Failed to load example', 'danger');
    }
}

function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
    alertDiv.style.zIndex = '1050';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, CONFIG.NOTIFICATION_TIMEOUT);
}

function updateButtonStates() {
    const svg = DOM.previewContainer.querySelector('svg');
    let hasValidFormula = false;

    if (svg) {
        const errorIndicators = svg.querySelectorAll('[data-mml-node="merror"]');
        hasValidFormula = errorIndicators.length === 0;
    }
    DOM.btnClipboard.disabled = !hasValidFormula;
    DOM.btnDownload.disabled = !hasValidFormula;
    DOM.btnExample.disabled = !DOM.exampleSelect.value;
}

async function renderPreview() {
    const latexFormula = DOM.formulaInput.value.trim();
    DOM.previewContainer.textContent = latexFormula ? 'Rendering...' : 'Enter a LaTeX formula to see preview';
    if (!latexFormula) {
        updateButtonStates();
        return;
    }
    try {
        const node = await MathJax.tex2svgPromise(latexFormula, { display: true });
        const svg = node.querySelector('svg');
        DOM.previewContainer.innerHTML = '';
        DOM.previewContainer.appendChild(svg);
    } catch (error) {
        const errorMessage = error.message || 'Unknown error occurred';
        DOM.previewContainer.innerHTML = `<span class="text-danger">LaTeX rendering error: ${errorMessage}</span>`;
        console.error('LaTeX rendering error:', error);
    }
    updateButtonStates();
}

function prepareExportData() {
    const svg = DOM.previewContainer.querySelector('svg');
    if (!svg) {
        showNotification('Please enter a valid LaTeX formula before exporting', 'warning');
        return null;
    }

    let scale = parseFloat(DOM.scaleRange.value) || CONFIG.SCALE_DEFAULT;
    if (scale < CONFIG.SCALE_MIN || scale > CONFIG.SCALE_MAX) {
        showNotification(`Invalid scale value. Using default scale of ${CONFIG.SCALE_DEFAULT}`, 'warning');
        scale = CONFIG.SCALE_DEFAULT;
    }

    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const originalDimension = svg.getBoundingClientRect();
    const scaledWidth = originalDimension.width * scale;
    const scaledHeight = originalDimension.height * scale;

    return {
        svg: svgClone,
        scale: scale,
        originalWidth: originalDimension.width,
        originalHeight: originalDimension.height,
        scaledWidth: scaledWidth,
        scaledHeight: scaledHeight
    };
}

function applySvgDimensions(svg, width, height) {
    svg.setAttribute('width', `${width}px`);
    svg.setAttribute('height', `${height}px`);
}

function overrideCurrentColorToBlack(svg) {
    const allElements = svg.querySelectorAll('*');
    allElements.forEach(el => {
        const fill = el.getAttribute('fill');
        if (fill === 'currentColor') {
            el.setAttribute('fill', '#000000');
        }
        const stroke = el.getAttribute('stroke');
        if (stroke === 'currentColor') {
            el.setAttribute('stroke', '#000000');
        }
        const style = el.getAttribute('style');
        if (style && style.includes('currentColor')) {
            const updatedStyle = style.replace(/currentColor/g, '#000000');
            el.setAttribute('style', updatedStyle);
        }
    });
}

async function handleClipboardExport(blob, type) {
    if (!blob) {
        showNotification(`Failed to create ${type} blob`, 'danger');
        return;
    }
    try {
        const mimeType = type === 'SVG' ? 'image/svg+xml' : 'image/png';
        const item = new ClipboardItem({ [mimeType]: blob });
        await navigator.clipboard.write([item]);
        showNotification(`${type} copied to clipboard!`, 'success');
    } catch (err) {
        if (type === 'SVG') {
            try {
                const svgString = await blob.text();
                await navigator.clipboard.writeText(svgString);
                showNotification('SVG source copied to clipboard!', 'success');
            } catch (fallbackErr) {
                showNotification('Clipboard access denied. Please check browser permissions', 'danger');
                console.error('Clipboard error:', fallbackErr);
            }
        } else {
            showNotification('Clipboard access denied. Please check browser permissions', 'danger');
            console.error('Clipboard error:', err);
        }
    }
}

function handleFileDownload(blob, filename, type) {
    if (!blob) {
        showNotification(`Failed to create ${type} blob`, 'danger');
        return;
    }
    try {
        saveAs(blob, filename);
        showNotification(`${type} file downloaded successfully`, 'success');
    } catch (error) {
        console.error(`Error saving ${type} file:`, error);
        showNotification(`Failed to save ${type} file`, 'danger');
    }
}

async function exportSVG(exportMode) {
    const exportData = prepareExportData();
    if (!exportData) return;

    try {
        const { svg: svgClone, scaledWidth, scaledHeight } = exportData;

        applySvgDimensions(svgClone, scaledWidth, scaledHeight);
        overrideCurrentColorToBlack(svgClone);

        const svgString = new XMLSerializer().serializeToString(svgClone);
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

        if (exportMode === 'clipboard') {
            await handleClipboardExport(blob, 'SVG');
        } else {
            handleFileDownload(blob, 'formula.svg', 'SVG');
        }
    } catch (err) {
        const errorMessage = err.message || 'Unknown error occurred during SVG export';
        showNotification(`Failed to export SVG: ${errorMessage}`, 'danger');
        console.error('SVG export error:', err);
    }
}

async function exportPNG(exportMode) {
    const exportData = prepareExportData();
    if (!exportData) return;

    try {
        const { svg: svgClone, scale, originalWidth, originalHeight, scaledWidth, scaledHeight } = exportData;

        applySvgDimensions(svgClone, scaledWidth, scaledHeight);
        overrideCurrentColorToBlack(svgClone);

        const svgString = new XMLSerializer().serializeToString(svgClone);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to create canvas context');
        }

        const padding = CONFIG.PNG_PADDING;
        canvas.width = scaledWidth + padding * 2;
        canvas.height = scaledHeight + padding * 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function () {
            ctx.drawImage(img, padding, padding, scaledWidth, scaledHeight);
            URL.revokeObjectURL(url);

            canvas.toBlob(async (blob) => {
                if (exportMode === 'clipboard') {
                    await handleClipboardExport(blob, 'PNG');
                } else {
                    handleFileDownload(blob, 'formula.png', 'PNG');
                }
            });
        };

        img.onerror = function () {
            URL.revokeObjectURL(url);
            showNotification('Failed to load SVG image', 'danger');
        };

        img.src = url;
    } catch (err) {
        const errorMessage = err.message || 'Unknown error occurred during PNG export';
        showNotification(`Failed to export PNG: ${errorMessage}`, 'danger');
        console.error('PNG export error:', err);
    }
}