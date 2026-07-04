// Inner Avatar ChatGPT Widget
class InnerAvatarWidget {
    constructor() {
        this.apiBase = window.location.origin;
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
    }

    bindEvents() {
        this.analyzeBtn.addEventListener('click', () => this.handleAnalyze());
        this.saveBtn.addEventListener('click', () => this.handleSave());
        this.continueBtn.addEventListener('click', () => this.handleContinue());
    }

    async handleAnalyze() {
        const text = this.journalText.value.trim();
        if (!text) {
            alert('Please write something to reflect on.');
            return;
        }

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
            alert('Sorry, there was an error generating your reflection. Please try again.');
            this.hideLoading();
        }
    }

    async handleSave() {
        const text = this.journalText.value.trim();
        if (!text) return;

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

            alert('Reflection saved! You can continue working with it in the full Inner Avatar app.');
        } catch (error) {
            console.error('Save failed:', error);
            alert('Sorry, there was an error saving your reflection. You can still continue in the full app.');
        }
    }

    handleContinue() {
        // Open the full Inner Avatar web app
        window.open('https://inner-avatar.ai/dashboard', '_blank');
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
        // Display avatar reflection
        let reflectionHtml = '';
        if (reflection.openingLine) reflectionHtml += `<p><strong>${reflection.openingLine}</strong></p>`;
        if (reflection.mirror) reflectionHtml += `<p>${reflection.mirror}</p>`;
        if (reflection.patternName) reflectionHtml += `<p><em>Pattern: ${reflection.patternName}</em></p>`;
        if (reflection.contradiction) reflectionHtml += `<p>${reflection.contradiction}</p>`;
        if (reflection.socraticQuestion) reflectionHtml += `<p>${reflection.socraticQuestion}</p>`;
        if (reflection.integrationStep) reflectionHtml += `<p>${reflection.integrationStep}</p>`;
        if (reflection.closingLine) reflectionHtml += `<p><strong>${reflection.closingLine}</strong></p>`;

        this.reflectionContent.innerHTML = reflectionHtml;

        // Display personalized prompt
        let promptHtml = '';
        if (prompt.title) promptHtml += `<p><strong>${prompt.title}</strong></p>`;
        if (prompt.context) promptHtml += `<p>${prompt.context}</p>`;
        if (prompt.materialsAndPreparation) promptHtml += `<p><em>Materials: ${prompt.materialsAndPreparation}</em></p>`;
        if (prompt.execution) promptHtml += `<p>${prompt.execution}</p>`;
        if (prompt.integration) promptHtml += `<p>${prompt.integration}</p>`;

        this.promptContent.innerHTML = promptHtml;
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

    showReflection() {
        this.journalSection.classList.add('hidden');
        this.reflectionSection.classList.remove('hidden');
    }
}

// Initialize widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InnerAvatarWidget();
});
