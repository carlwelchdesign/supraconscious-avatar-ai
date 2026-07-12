// Supraconscious ChatGPT Widget
class InnerAvatarWidget {
    constructor() {
        this.apiBase = window.location.origin;
        this.webAppUrl = this.readWebAppUrl();
        this.locale = this.resolveLocale();
        this.copy = WIDGET_COPY[this.locale] || WIDGET_COPY.en;
        this.init();
    }

    init() {
        this.bindElements();
        this.localizeStaticCopy();
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
            this.setStatus(this.copy.emptyEntry, 'error');
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
            this.setStatus(this.copy.analysisError, 'error');
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

            this.setStatus(this.copy.saveSuccess, 'success');
        } catch (error) {
            console.error('Save failed:', error);
            this.setStatus(this.copy.saveError, 'error');
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
            throw new Error(error.error || this.copy.apiError);
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
        this.appendParagraph(this.reflectionContent, reflection.patternName ? `${this.copy.patternLabel}: ${reflection.patternName}` : '', 'em');
        this.appendParagraph(this.reflectionContent, reflection.contradiction);
        this.appendParagraph(this.reflectionContent, reflection.socraticQuestion);
        this.appendParagraph(this.reflectionContent, reflection.integrationStep);
        this.appendParagraph(this.reflectionContent, reflection.closingLine, 'strong');
    }

    renderPrompt(prompt) {
        this.promptContent.replaceChildren();
        this.appendParagraph(this.promptContent, prompt.title, 'strong');
        this.appendParagraph(this.promptContent, prompt.context);
        this.appendParagraph(this.promptContent, prompt.materialsAndPreparation ? `${this.copy.materialsLabel}: ${prompt.materialsAndPreparation}` : '', 'em');
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
        this.analyzeBtn.textContent = this.copy.reflecting;
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.analyzeBtn.disabled = false;
        this.analyzeBtn.textContent = this.copy.reflect;
    }

    setSaveState(isSaving) {
        this.saveBtn.disabled = isSaving;
        this.saveBtn.textContent = isSaving ? this.copy.saving : this.copy.save;
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

    resolveLocale() {
        const configured = window.INNER_AVATAR_WIDGET_CONFIG?.language;
        const locale = configured || document.documentElement.lang || navigator.language || 'en';
        const normalized = locale.toLowerCase();
        if (normalized.startsWith('zh')) return 'zh-Hans';
        if (normalized.startsWith('es')) return 'es';
        if (normalized.startsWith('el')) return 'el';
        if (normalized.startsWith('fr')) return 'fr';
        if (normalized.startsWith('de')) return 'de';
        return 'en';
    }

    localizeStaticCopy() {
        document.documentElement.lang = this.locale;
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            if (key && this.copy[key]) element.textContent = this.copy[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (key && this.copy[key]) element.setAttribute('placeholder', this.copy[key]);
        });
    }
}

const WIDGET_COPY = {
    en: {
        shareTitle: "Share what's on your mind",
        journalPlaceholder: "Write about what's happening right now...",
        reflect: "Reflect",
        reflecting: "Reflecting...",
        guideReflection: "Guide Reflection",
        personalizedPrompt: "Personalized Prompt",
        save: "Save to Supraconscious",
        continue: "Continue in Full App",
        saving: "Saving...",
        emptyEntry: "Please write something to reflect on.",
        analysisError: "Sorry, there was an error generating your reflection. Please try again.",
        saveSuccess: "Reflection saved. You can continue working with it in the full Supraconscious app.",
        saveError: "Sorry, there was an error saving your reflection. You can still continue in the full app.",
        apiError: "API call failed",
        patternLabel: "Pattern",
        materialsLabel: "Materials",
    },
    es: {
        shareTitle: "Comparte lo que tienes en mente",
        journalPlaceholder: "Escribe lo que está ocurriendo ahora...",
        reflect: "Reflexionar",
        reflecting: "Reflexionando...",
        guideReflection: "Reflexión del guía",
        personalizedPrompt: "Prompt personalizado",
        save: "Guardar en Supraconscious",
        continue: "Continuar en la app completa",
        saving: "Guardando...",
        emptyEntry: "Escribe algo para reflexionar.",
        analysisError: "Hubo un error al generar tu reflexión. Inténtalo de nuevo.",
        saveSuccess: "Reflexión guardada. Puedes continuar en la app completa de Supraconscious.",
        saveError: "Hubo un error al guardar tu reflexión. Aún puedes continuar en la app completa.",
        apiError: "La llamada a la API falló",
        patternLabel: "Patrón",
        materialsLabel: "Materiales",
    },
    el: {
        shareTitle: "Μοιράσου ό,τι έχεις στο μυαλό σου",
        journalPlaceholder: "Γράψε τι συμβαίνει αυτήν τη στιγμή...",
        reflect: "Αντανάκλαση",
        reflecting: "Γίνεται αντανάκλαση...",
        guideReflection: "Αντανάκλαση οδηγού",
        personalizedPrompt: "Προσωπικό prompt",
        save: "Αποθήκευση στο Supraconscious",
        continue: "Συνέχεια στην πλήρη εφαρμογή",
        saving: "Αποθήκευση...",
        emptyEntry: "Γράψε κάτι για να γίνει αντανάκλαση.",
        analysisError: "Παρουσιάστηκε σφάλμα στη δημιουργία της αντανάκλασης. Δοκίμασε ξανά.",
        saveSuccess: "Η αντανάκλαση αποθηκεύτηκε. Μπορείς να συνεχίσεις στην πλήρη εφαρμογή Supraconscious.",
        saveError: "Παρουσιάστηκε σφάλμα στην αποθήκευση. Μπορείς ακόμη να συνεχίσεις στην πλήρη εφαρμογή.",
        apiError: "Η κλήση API απέτυχε",
        patternLabel: "Μοτίβο",
        materialsLabel: "Υλικά",
    },
    fr: {
        shareTitle: "Partagez ce que vous avez en tête",
        journalPlaceholder: "Écrivez ce qui se passe maintenant...",
        reflect: "Réfléchir",
        reflecting: "Réflexion...",
        guideReflection: "Réflexion du guide",
        personalizedPrompt: "Prompt personnalisé",
        save: "Enregistrer dans Supraconscious",
        continue: "Continuer dans l’app complète",
        saving: "Enregistrement...",
        emptyEntry: "Écrivez quelque chose à explorer.",
        analysisError: "Une erreur est survenue pendant la génération de votre réflexion. Réessayez.",
        saveSuccess: "Réflexion enregistrée. Vous pouvez continuer dans l’application Supraconscious complète.",
        saveError: "Une erreur est survenue pendant l’enregistrement. Vous pouvez toujours continuer dans l’app complète.",
        apiError: "L’appel API a échoué",
        patternLabel: "Schéma",
        materialsLabel: "Matériel",
    },
    de: {
        shareTitle: "Teile, was dir durch den Kopf geht",
        journalPlaceholder: "Schreibe, was gerade passiert...",
        reflect: "Reflektieren",
        reflecting: "Reflexion läuft...",
        guideReflection: "Guide-Reflexion",
        personalizedPrompt: "Personalisierter Prompt",
        save: "In Supraconscious speichern",
        continue: "In der vollständigen App fortfahren",
        saving: "Speichern...",
        emptyEntry: "Schreibe etwas, worüber reflektiert werden kann.",
        analysisError: "Beim Erzeugen deiner Reflexion ist ein Fehler aufgetreten. Bitte versuche es erneut.",
        saveSuccess: "Reflexion gespeichert. Du kannst in der vollständigen Supraconscious-App weiterarbeiten.",
        saveError: "Beim Speichern ist ein Fehler aufgetreten. Du kannst trotzdem in der vollständigen App fortfahren.",
        apiError: "API-Aufruf fehlgeschlagen",
        patternLabel: "Muster",
        materialsLabel: "Materialien",
    },
    "zh-Hans": {
        shareTitle: "分享你正在想的事",
        journalPlaceholder: "写下此刻正在发生的事...",
        reflect: "反思",
        reflecting: "正在反思...",
        guideReflection: "指南反思",
        personalizedPrompt: "个性化提示",
        save: "保存到 Supraconscious",
        continue: "在完整应用中继续",
        saving: "正在保存...",
        emptyEntry: "请写下一些内容用于反思。",
        analysisError: "生成反思时出错。请重试。",
        saveSuccess: "反思已保存。你可以在完整的 Supraconscious 应用中继续。",
        saveError: "保存反思时出错。你仍然可以在完整应用中继续。",
        apiError: "API 调用失败",
        patternLabel: "模式",
        materialsLabel: "材料",
    },
};

// Initialize widget when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InnerAvatarWidget();
});
