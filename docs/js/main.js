const DOM = {
    formulaInput: document.getElementById('texInput'),
    previewContainer: document.getElementById('preview'),
    btnClipboard: document.getElementById('btnClipboard'),
    btnDownload: document.getElementById('btnDownload'),
    btnUndoFormulaInput: document.getElementById('btnUndoFormulaInput'),
    btnRedoFormulaInput: document.getElementById('btnRedoFormulaInput'),
    scaleRange: document.getElementById('scaleRange'),
    scaleValue: document.getElementById('scaleValue'),
    formulaInputShell: document.getElementById('formulaInputShell'),
    templateRailLeft: document.getElementById('templateRailLeft'),
    templateRailRight: document.getElementById('templateRailRight'),
    templatePopup: document.getElementById('templatePopup'),
    templatePopupTitle: document.getElementById('templatePopupTitle'),
    templatePopupBody: document.getElementById('templatePopupBody'),
    templatePopupClose: document.getElementById('templatePopupClose')
};

const CONFIG = {
    RENDER_DEBOUNCE_MS: 500,
    SCALE_MIN: 0.5,
    SCALE_MAX: 4,
    SCALE_DEFAULT: 1,
    NOTIFICATION_TIMEOUT: 3000,
    PNG_PADDING: 1,
    TEMPLATE_COMMAND_MAX_COLSPAN: 2,
    CONFIG_PATH: 'config/template-config.json'
};

let templateGroups = [];

let renderDebounceTimer;
let activeTemplateLauncher = null;
let activeTemplateGroupId = '';
let formulaInputHistory = [];
let formulaInputHistoryIndex = -1;
let isApplyingFormulaInputHistory = false;

MathJax.startup.promise.then(async () => {
    DOM.btnClipboard.addEventListener('click', () => handleExport('clipboard'));
    DOM.btnDownload.addEventListener('click', () => handleExport('download'));

    if (DOM.btnUndoFormulaInput) {
        DOM.btnUndoFormulaInput.addEventListener('click', undoFormulaInput);
    }

    if (DOM.btnRedoFormulaInput) {
        DOM.btnRedoFormulaInput.addEventListener('click', redoFormulaInput);
    }

    DOM.scaleRange.addEventListener('input', () => {
        DOM.scaleValue.textContent = parseFloat(DOM.scaleRange.value).toFixed(1);
    });

    initializeFormulaInputHistory();
    DOM.formulaInput.addEventListener('beforeinput', handleFormulaInputBeforeInput);
    DOM.formulaInput.addEventListener('input', handleFormulaInputChange);

    if (DOM.templateRailLeft) {
        DOM.templateRailLeft.addEventListener('click', handleTemplateGroupClick);
    }

    if (DOM.templateRailRight) {
        DOM.templateRailRight.addEventListener('click', handleTemplateGroupClick);
    }

    if (DOM.templatePopupBody) {
        DOM.templatePopupBody.addEventListener('click', handleTemplateCommandClick);
    }

    if (DOM.templatePopupClose) {
        DOM.templatePopupClose.addEventListener('click', hideTemplatePopup);
    }

    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleGlobalKeydown);
    window.addEventListener('resize', positionTemplatePopup);

    await loadTemplateIconConfig();
    renderTemplateGroupButtons();
    renderPreview();
    updateButtonStates();
});

function initializeFormulaInputHistory() {
    formulaInputHistory = [captureFormulaInputState()];
    formulaInputHistoryIndex = 0;
    updateFormulaInputHistoryButtons();
}

function handleFormulaInputChange() {
    if (!isApplyingFormulaInputHistory) {
        recordFormulaInputHistoryState();
    }

    clearTimeout(renderDebounceTimer);
    renderDebounceTimer = setTimeout(renderPreview, CONFIG.RENDER_DEBOUNCE_MS);
}

function handleFormulaInputBeforeInput(event) {
    if (event.inputType === 'historyUndo') {
        event.preventDefault();
        undoFormulaInput();
    }

    if (event.inputType === 'historyRedo') {
        event.preventDefault();
        redoFormulaInput();
    }
}

function captureFormulaInputState() {
    const textarea = DOM.formulaInput;
    if (!textarea) {
        return {
            value: '',
            selectionStart: 0,
            selectionEnd: 0,
            selectionDirection: 'none'
        };
    }

    return {
        value: textarea.value,
        selectionStart: textarea.selectionStart ?? textarea.value.length,
        selectionEnd: textarea.selectionEnd ?? textarea.value.length,
        selectionDirection: textarea.selectionDirection || 'none'
    };
}

function recordFormulaInputHistoryState() {
    const state = captureFormulaInputState();
    const currentState = formulaInputHistory[formulaInputHistoryIndex];
    if (currentState && currentState.value === state.value) {
        updateFormulaInputHistoryButtons();
        return;
    }

    if (formulaInputHistoryIndex < formulaInputHistory.length - 1) {
        formulaInputHistory = formulaInputHistory.slice(0, formulaInputHistoryIndex + 1);
    }

    formulaInputHistory.push(state);
    formulaInputHistoryIndex = formulaInputHistory.length - 1;
    updateFormulaInputHistoryButtons();
}

function undoFormulaInput() {
    if (!canUndoFormulaInput()) return;

    formulaInputHistoryIndex -= 1;
    applyFormulaInputHistoryState(formulaInputHistory[formulaInputHistoryIndex]);
}

function redoFormulaInput() {
    if (!canRedoFormulaInput()) return;

    formulaInputHistoryIndex += 1;
    applyFormulaInputHistoryState(formulaInputHistory[formulaInputHistoryIndex]);
}

function applyFormulaInputHistoryState(state) {
    const textarea = DOM.formulaInput;
    if (!textarea || !state) return;

    isApplyingFormulaInputHistory = true;
    try {
        textarea.value = state.value;
        const selectionStart = clampInteger(state.selectionStart, 0, textarea.value.length, textarea.value.length);
        const selectionEnd = clampInteger(state.selectionEnd, selectionStart, textarea.value.length, selectionStart);
        const selectionDirection = ['forward', 'backward', 'none'].includes(state.selectionDirection)
            ? state.selectionDirection
            : 'none';

        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } finally {
        isApplyingFormulaInputHistory = false;
        updateFormulaInputHistoryButtons();
    }
}

function canUndoFormulaInput() {
    return formulaInputHistoryIndex > 0;
}

function canRedoFormulaInput() {
    return formulaInputHistoryIndex >= 0 && formulaInputHistoryIndex < formulaInputHistory.length - 1;
}

function updateFormulaInputHistoryButtons() {
    if (DOM.btnUndoFormulaInput) {
        DOM.btnUndoFormulaInput.disabled = !canUndoFormulaInput();
    }

    if (DOM.btnRedoFormulaInput) {
        DOM.btnRedoFormulaInput.disabled = !canRedoFormulaInput();
    }
}

async function loadTemplateIconConfig() {
    templateGroups = [];

    try {
        const response = await fetch(CONFIG.CONFIG_PATH, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const parsedConfig = await response.json();
        templateGroups = normalizeTemplateIconConfig(parsedConfig).templateGroups;
    } catch (error) {
        console.warn('Template icon config load failed. Using default icons.', error);
    }
}

function normalizeTemplateIconConfig(config) {
    const normalized = {
        templateGroups: []
    };

    if (!config || typeof config !== 'object') {
        return normalized;
    }

    if (Array.isArray(config.templateGroups)) {
        normalized.templateGroups = config.templateGroups
            .map(normalizeTemplateGroup)
            .filter((group) => group && group.items.length);
    }

    return normalized;
}

function normalizeTemplateGroup(group) {
    if (!group || typeof group !== 'object') {
        return null;
    }

    const id = typeof group.id === 'string' ? group.id.trim() : '';
    if (!id) {
        return null;
    }

    const label = typeof group.label === 'string' && group.label.trim()
        ? group.label.trim()
        : id;
    const side = group.side === 'right' ? 'right' : 'left';
    const icon = normalizeIconDefinition(group.icon, label);

    const items = Array.isArray(group.items)
        ? group.items.map(normalizeTemplateGroupItem).filter(Boolean)
        : [];

    return {
        id,
        side,
        label,
        icon,
        items
    };
}

function normalizeTemplateGroupItem(item) {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const label = typeof item.label === 'string' ? item.label : '';
    const insert = typeof item.insert === 'string' ? item.insert : '';
    if (!label || !insert) {
        return null;
    }

    const selectionStart = normalizeOptionalNonNegativeInteger(item.selectionStart);
    const selectionLength = normalizeOptionalNonNegativeInteger(item.selectionLength);
    const colspan = normalizeTemplateCommandColspan(item.colspan);
    const icon = Object.prototype.hasOwnProperty.call(item, 'icon')
        ? normalizeIconDefinition(item.icon, label)
        : null;

    return {
        label,
        insert,
        icon,
        selectionStart,
        selectionLength,
        colspan
    };
}

function normalizeTemplateCommandColspan(value) {
    if (value === null || value === undefined || value === '') {
        return 1;
    }

    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric < 1) {
        return 1;
    }

    return Math.min(numeric, CONFIG.TEMPLATE_COMMAND_MAX_COLSPAN);
}

function normalizeOptionalNonNegativeInteger(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const numeric = Number(value);
    if (!Number.isInteger(numeric) || numeric < 0) {
        return null;
    }

    return numeric;
}

function normalizeIconDefinition(candidate, fallbackMath) {
    if (typeof candidate === 'string') {
        return {
            type: 'mathjax',
            content: candidate
        };
    }

    if (!candidate || typeof candidate !== 'object') {
        return {
            type: 'mathjax',
            content: fallbackMath
        };
    }

    if (candidate.type !== 'svg' && candidate.type !== 'mathjax') {
        return {
            type: 'mathjax',
            content: fallbackMath
        };
    }

    const content = typeof candidate.content === 'string' ? candidate.content.trim() : '';
    if (!content) {
        return {
            type: 'mathjax',
            content: fallbackMath
        };
    }

    return {
        type: candidate.type,
        content
    };
}

function createTemplateIconElement(iconDefinition, fallbackMath, fallbackText) {
    const iconSlot = document.createElement('span');
    iconSlot.className = 'template-icon-slot';

    if (iconDefinition.type === 'svg') {
        const svgElement = createSvgIconElement(iconDefinition.content);
        if (svgElement) {
            iconSlot.appendChild(svgElement);
            return iconSlot;
        }
    }

    const label = document.createElement('span');
    label.className = 'template-math-label';
    label.dataset.fallback = fallbackText || '';
    label.textContent = `\\(${iconDefinition.content || fallbackMath}\\)`;
    iconSlot.appendChild(label);
    return iconSlot;
}

function createSvgIconElement(svgMarkup) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgMarkup, 'image/svg+xml');
    if (svgDoc.querySelector('parsererror')) {
        return null;
    }

    const svg = svgDoc.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') {
        return null;
    }

    const importedSvg = document.importNode(svg, true);
    importedSvg.classList.add('template-svg-icon');
    importedSvg.setAttribute('aria-hidden', 'true');
    return importedSvg;
}

function renderTemplateGroupButtons() {
    if (!DOM.templateRailLeft || !DOM.templateRailRight) return;

    DOM.templateRailLeft.innerHTML = '';
    DOM.templateRailRight.innerHTML = '';

    templateGroups.forEach((group) => {
        const launcher = createTemplateGroupButton(group);
        if (group.side === 'right') {
            DOM.templateRailRight.appendChild(launcher);
        } else {
            DOM.templateRailLeft.appendChild(launcher);
        }
    });

    renderMathLabels(DOM.formulaInputShell);
}

function createTemplateGroupButton(group) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline-secondary template-group-btn';
    button.dataset.groupId = group.id;
    button.dataset.side = group.side || 'left';
    button.setAttribute('aria-label', group.label);
    button.setAttribute('title', group.label);

    const fallbackMath = group.label;
    const iconDefinition = normalizeIconDefinition(group.icon, fallbackMath);
    const iconElement = createTemplateIconElement(iconDefinition, fallbackMath, group.label);
    button.appendChild(iconElement);

    return button;
}

function handleTemplateGroupClick(event) {
    const launcher = event.target.closest('.template-group-btn');
    if (!launcher) return;

    const groupId = launcher.dataset.groupId;
    if (!groupId) return;

    if (!DOM.templatePopup.hidden && groupId === activeTemplateGroupId) {
        hideTemplatePopup();
        return;
    }

    openTemplatePopup(groupId, launcher);
}

function openTemplatePopup(groupId, launcher) {
    const group = templateGroups.find((item) => item.id === groupId);
    if (!group || !DOM.templatePopupBody || !DOM.templatePopupTitle || !DOM.templatePopup) return;

    activeTemplateGroupId = groupId;
    activeTemplateLauncher = launcher;
    setActiveTemplateLauncher(launcher);

    DOM.templatePopupTitle.textContent = group.label;
    DOM.templatePopupBody.innerHTML = '';

    group.items.forEach((template) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-primary template-command-btn';
        button.dataset.template = template.insert;
        button.dataset.selectionStart = template.selectionStart ?? '';
        button.dataset.selectionLength = template.selectionLength ?? '';
        button.setAttribute('aria-label', template.label);
        button.setAttribute('title', template.insert);

        if (template.colspan > 1) {
            button.dataset.colspan = String(template.colspan);
            button.classList.add('template-command-btn-colspan');
            button.style.setProperty('--template-command-colspan', String(template.colspan));
        }

        const fallbackMath = template.label;
        const iconDefinition = normalizeIconDefinition(template.icon, fallbackMath);
        const iconElement = createTemplateIconElement(iconDefinition, fallbackMath, template.label);
        button.appendChild(iconElement);

        DOM.templatePopupBody.appendChild(button);
    });

    DOM.templatePopup.hidden = false;
    positionTemplatePopup();
    renderMathLabels(DOM.templatePopup).finally(positionTemplatePopup);
}

function positionTemplatePopup() {
    if (!DOM.templatePopup || DOM.templatePopup.hidden || !DOM.formulaInputShell || !activeTemplateLauncher) return;

    const shellRect = DOM.formulaInputShell.getBoundingClientRect();
    const launcherRect = activeTemplateLauncher.getBoundingClientRect();
    const popup = DOM.templatePopup;

    popup.style.left = '0px';
    popup.style.top = '0px';
    const popupRect = popup.getBoundingClientRect();

    const margin = 8;
    const gap = 8;

    let top = launcherRect.top - shellRect.top + (launcherRect.height - popupRect.height) / 2;
    top = Math.max(margin, Math.min(top, shellRect.height - popupRect.height - margin));

    const side = activeTemplateLauncher.dataset.side || 'left';
    let left = side === 'right'
        ? launcherRect.left - shellRect.left - popupRect.width - gap
        : launcherRect.right - shellRect.left + gap;

    left = Math.max(margin, Math.min(left, shellRect.width - popupRect.width - margin));

    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
}

function handleTemplateCommandClick(event) {
    const button = event.target.closest('[data-template]');
    if (!button) return;

    const placement = {
        selectionStart: normalizeOptionalNonNegativeInteger(button.dataset.selectionStart),
        selectionLength: normalizeOptionalNonNegativeInteger(button.dataset.selectionLength)
    };

    insertTemplateAtCaret(button.dataset.template, placement);
    hideTemplatePopup();
}

function handleDocumentClick(event) {
    if (!DOM.templatePopup || DOM.templatePopup.hidden) return;

    if (DOM.templatePopup.contains(event.target)) return;
    if (event.target.closest('.template-group-btn')) return;

    hideTemplatePopup();
}

function handleGlobalKeydown(event) {
    const key = event.key.toLowerCase();
    const isFormulaInputShortcut = event.target === DOM.formulaInput
        && (event.ctrlKey || event.metaKey)
        && !event.altKey;

    if (isFormulaInputShortcut && !event.shiftKey && key === 'z') {
        event.preventDefault();
        undoFormulaInput();
        return;
    }

    if (isFormulaInputShortcut && ((event.shiftKey && key === 'z') || (!event.shiftKey && key === 'y'))) {
        event.preventDefault();
        redoFormulaInput();
        return;
    }

    if (event.key === 'Escape') {
        hideTemplatePopup();
    }
}

function hideTemplatePopup() {
    if (!DOM.templatePopup || DOM.templatePopup.hidden) return;

    DOM.templatePopup.hidden = true;
    if (DOM.templatePopupBody) {
        DOM.templatePopupBody.innerHTML = '';
    }
    if (DOM.templatePopupTitle) {
        DOM.templatePopupTitle.textContent = '';
    }

    activeTemplateGroupId = '';
    activeTemplateLauncher = null;
    setActiveTemplateLauncher(null);
}

function setActiveTemplateLauncher(launcher) {
    if (!DOM.formulaInputShell) return;

    DOM.formulaInputShell.querySelectorAll('.template-group-btn.active')
        .forEach((button) => button.classList.remove('active'));

    if (launcher) {
        launcher.classList.add('active');
    }
}

function renderMathLabels(scopeElement) {
    if (!scopeElement) return Promise.resolve();

    const labelNodes = Array.from(scopeElement.querySelectorAll('.template-math-label'));
    if (!labelNodes.length) return Promise.resolve();

    return Promise.all(labelNodes.map((node) => {
        return MathJax.typesetPromise([node]).catch((error) => {
            console.error('Template label rendering error:', error);
            if (!node.querySelector('mjx-container')) {
                node.textContent = node.dataset.fallback || '';
            }
        });
    }));
}

function insertTemplateAtCaret(template, placement = {}) {
    const textarea = DOM.formulaInput;
    if (!textarea) return;

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const insertion = String(template);
    textarea.value = `${before}${insertion}${after}`;

    const insertionLength = insertion.length;
    const selectionStartOffset = clampInteger(placement.selectionStart, 0, insertionLength);
    const selectionLength = clampInteger(placement.selectionLength, 0, insertionLength - selectionStartOffset);
    const hasSelection = selectionLength > 0;

    if (hasSelection) {
        const absoluteSelectionStart = start + selectionStartOffset;
        const absoluteSelectionEnd = absoluteSelectionStart + selectionLength;
        textarea.setSelectionRange(absoluteSelectionStart, absoluteSelectionEnd);
    } else {
        const absoluteCaret = start + insertionLength;
        textarea.setSelectionRange(absoluteCaret, absoluteCaret);
    }

    textarea.focus();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function clampInteger(value, min, max, fallback = min) {
    if (!Number.isInteger(value)) {
        return fallback;
    }
    return Math.min(Math.max(value, min), max);
}

function handleExport(exportMode) {
    const format = document.querySelector('input[name="format"]:checked').value;
    if (format === 'svg') {
        exportSVG(exportMode);
    } else {
        exportPNG(exportMode);
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
        scaledWidth: scaledWidth,
        scaledHeight: scaledHeight
    };
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

        svgClone.setAttribute('width', `${scaledWidth}px`);
        svgClone.setAttribute('height', `${scaledHeight}px`);
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
        const { svg: svgClone, scaledWidth, scaledHeight } = exportData;

        svgClone.setAttribute('width', `${scaledWidth}px`);
        svgClone.setAttribute('height', `${scaledHeight}px`);
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
