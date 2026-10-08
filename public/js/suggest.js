/* ==================================================
   SEARCH SUGGESTIONS (autocomplete dropdown)
   Shows matching course codes from the database while the
   student types, so small typing mistakes don't matter.
================================================== */

(function () {

    const input = document.getElementById('course-code');
    const form = document.getElementById('search-form');
    if (!input || !form) return;

    const wrapper = input.closest('.search-input-wrapper');
    wrapper.classList.add('has-suggestions');

    const list = document.createElement('ul');
    list.id = 'suggestions';
    list.className = 'suggestions';
    list.setAttribute('role', 'listbox');
    list.hidden = true;
    wrapper.appendChild(list);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', 'suggestions');

    let items = [];
    let active = -1;
    let timer = null;
    let requestId = 0;

    function esc(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function hide() {
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        active = -1;
    }

    function setActive(index) {
        const nodes = list.querySelectorAll('li[data-code]');
        nodes.forEach(n => n.classList.remove('active'));
        active = index;
        if (index >= 0 && nodes[index]) {
            nodes[index].classList.add('active');
            nodes[index].scrollIntoView({ block: 'nearest' });
        }
    }

    function choose(code) {
        input.value = code;
        hide();
        form.requestSubmit();
    }

    function render(suggestions, fuzzy) {
        items = suggestions;
        if (!suggestions.length) { hide(); return; }

        list.innerHTML =
            (fuzzy ? '<li class="suggestions-note">Did you mean:</li>' : '') +
            suggestions.map(s =>
                '<li role="option" data-code="' + esc(s.course_code) + '">' +
                    '<strong>' + esc(s.course_code) + '</strong>' +
                    '<span>' + esc(s.paper_title || '') +
                    (s.program ? ' &middot; ' + esc(s.program) : '') +
                    (s.semester ? ' Sem ' + esc(s.semester) : '') + '</span>' +
                '</li>'
            ).join('');

        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        active = -1;
    }

    async function fetchSuggestions() {
        const q = input.value.trim();
        if (!q) { hide(); return; }

        const myRequest = ++requestId;
        try {
            const res = await fetch('/api/search/suggest?q=' + encodeURIComponent(q));
            if (!res.ok) return;
            const data = await res.json();
            if (myRequest !== requestId) return; // a newer keystroke won
            render(data.suggestions || [], data.fuzzy);
        } catch (e) {
            /* suggestions are optional - ignore network errors */
        }
    }

    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(fetchSuggestions, 150);
    });

    input.addEventListener('keydown', (e) => {
        if (list.hidden) return;
        const count = items.length;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((active + 1) % count);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((active - 1 + count) % count);
        } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            choose(items[active].course_code);
        } else if (e.key === 'Escape') {
            hide();
        }
    });

    list.addEventListener('mousedown', (e) => {
        // mousedown (not click) so it fires before the input loses focus
        const li = e.target.closest('li[data-code]');
        if (li) { e.preventDefault(); choose(li.dataset.code); }
    });

    input.addEventListener('blur', () => setTimeout(hide, 120));
    input.addEventListener('focus', () => { if (input.value.trim()) fetchSuggestions(); });

})();
