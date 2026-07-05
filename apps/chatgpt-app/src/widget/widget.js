// Supraconscious ChatGPT Widget
class InnerAvatarWidget {
    constructor() {
        this.apiBase = window.location.origin;
        this.webAppUrl = this.readWebAppUrl();
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
    }

    bindElements() {
        this.journalText = document.getElementById('journal-text');
        this.analyzeBtn = document.getElementById('analyze-btn');
        this.saveBtn = document.getElementById('save-btn');
        this.continueBtn = document.getElementById('continue-btn');
        this.journalSection = document.getElementById('journal-input-section');
        this.reflectionSection = document.getElementById('reflection-section');
        this.reflectionContent = document.getElementById('reflection-content');
        this.promptContent = document.getElementById('prompt-content');
        this.loading = document.getElementById('loading');
        this.statusMessage = document.getElementById('status-message');
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.handleAnalyze());
        this.saveBtn.addEventListener('click', () => this.handleSave());
        this.continueBtn.addEventListener('click', () => this.handleContinue());
    }

    async handleAnalyze() {
        const text = this.journalText.value.trim();
        if (!text) {
            this.setStatus('Please write something to reflect on.', 'error');
            return;
        }

        this.clearStatus();
        this.showLoading();

        try {
            // Run analysis, reflection, and prompt generation in parallel
            const [analysis, reflection, prompt] = await Promise.all([
                this.callTool('analyze_journal_entry', { text }),
                this.callTool('generate_avatar_reflection', { text, tone: 'balanced' }),
                this.callTool('generate_personalized_prompt', { text })
            ]);

            this.displayResults(analysis, reflection, prompt);
            this.hideLoading();
            this.showReflection();
        } catch (error) {
            console.error('Analysis failed:', error);
            this.setStatus('Sorry, there was an error generating your reflection. Please try again.', 'error');
            this.hideLoading();
        }
    }

    async handleSave() {
        const text = this.journalText.value.trim();
        if (!text) return;

        this.setSaveState(true);
        this.clearStatus();

        try {
            // Get current results
            const analysis = await this.callTool('analyze_journal_entry', { text });
            const reflection = await this.callTool('generate_avatar_reflection', { text, tone: 'balanced' });
            const prompt = await this.callTool('generate_personalized_prompt', { text });

            // Save the complete session
            await this.callTool('save_reflection_session', {
                entryText: text,
                analysis,
                avatarResponse: reflection,
                generatedPrompt: prompt
            });

            this.setStatus('Reflection saved. You can continue working with it in the full Supraconscious app.', 'success');
        } catch (error) {
            console.error('Save failed:', error);
            this.setStatus('Sorry, there was an error saving your reflection. You can still continue in the full app.', 'error');
        } finally {
            this.setSaveState(false);
        }
    }

    handleContinue() {
        // Open the full Supraconscious web app
        window.open(`${this.webAppUrl}/dashboard`, '_blank', 'noopener,noreferrer');
    }

    readWebAppUrl() {
        const configuredUrl = window.INNER_AVATAR_WIDGET_CONFIG?.webAppUrl || window.location.origin;
        return configuredUrl.replace(/\/+$/, '');
    }

    async callTool(toolName, input) {
        const response = await fetch(`${this.apiBase}/mcp/tools/${toolName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API call failed');
        }

        return await response.json();
    }

    displayResults(analysis, reflection, prompt) {
        this.renderReflection(reflection);
        this.renderPrompt(prompt);
    }

    renderReflection(reflection) {
        this.reflectionContent.replaceChildren();
        this.appendParagraph(this.reflectionContent, reflection.openingLine, 'strong');
        this.appendParagraph(this.reflectionContent, reflection.mirror);
        this.appendParagraph(this.reflectionContent, reflection.patternName ? `Pattern: ${reflection.patternName}` : '', 'em');
        this.appendParagraph(this.reflectionContent, reflection.contradiction);
        this.appendParagraph(this.reflectionContent, reflection.socraticQuestion);
        this.appendParagraph(this.reflectionContent, reflection.integrationStep);
        this.appendParagraph(this.reflectionContent, reflection.closingLine, 'strong');
    }

    renderPrompt(prompt) {
        this.promptContent.replaceChildren();
        this.appendParagraph(this.promptContent, prompt.title, 'strong');
        this.appendParagraph(this.promptContent, prompt.context);
        this.appendParagraph(this.promptContent, prompt.materialsAndPreparation ? `Materials: ${prompt.materialsAndPreparation}` : '', 'em');
        this.appendParagraph(this.promptContent, prompt.execution);
        this.appendParagraph(this.promptContent, prompt.integration);
    }

    appendParagraph(container, text, emphasis) {
        if (!text) return;
        const paragraph = document.createElement('p');
        if (emphasis) {
            const element = document.createElement(emphasis);
            element.textContent = text;
            paragraph.appendChild(element);
        } else {
            paragraph.textContent = text;
        }
        container.appendChild(paragraph);
    }

    showLoading() {
        this.loading.classList.remove('hidden');
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.textContent = 'Reflecting...';
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.analyzeBtn.disabled = false;
        this.analyzeBtn.textContent = 'Reflect';
    }

    setSaveState(isSaving) {
        this.saveBtn.disabled = isSaving;
        this.saveBtn.textContent = isSaving ? 'Saving...' : 'Save to Supraconscious';
    }

    setStatus(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message status-${type}`;
    }

    clearStatus() {
        this.statusMessage.textContent = '';
        this.statusMessage.className = 'status-message hidden';
    }

    showReflection() {
        this.journalSection.classList.add('hidden');
        this.reflectionSection.classList.remove('hidden');
        this.reflectionSection.appendChild(this.statusMessage);
    }
}

// Initialize widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InnerAvatarWidget();
});
