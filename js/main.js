window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 10) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// BibTeXパーサー
class BibTeXParser {
    constructor() {
        this.publications = [];
    }

    async loadBibTeX() {
        try {
            const response = await fetch('publications.bib');
            const bibText = await response.text();
            this.parseBibTeX(bibText);
            return this.publications;
        } catch (error) {
            console.error('BibTeXファイルの読み込みに失敗しました:', error);
            return [];
        }
    }

    parseBibTeX(bibText) {
        this.publications = [];
        
        if (!bibText || typeof bibText !== 'string') {
            console.error('Invalid bibText:', bibText);
            return;
        }
        
        // BibTeXエントリを抽出
        const entries = bibText.split(/@\w+\s*{/).slice(1);
        
        entries.forEach(entry => {
            if (!entry || typeof entry !== 'string') {
                console.warn('Invalid entry:', entry);
                return;
            }
            
            const lines = entry.split('\n');
            const firstLine = lines[0].trim();
            
            // エントリの種類とキーを安全に抽出
            const typeMatch = firstLine.match(/^(\w+),/);
            const keyMatch = firstLine.match(/^(\w+),/);
            
            if (!typeMatch || !keyMatch) {
                console.warn('Invalid BibTeX entry format:', firstLine);
                return;
            }
            
            const type = typeMatch[1];
            const key = keyMatch[1];
            
            const fields = {};
            let currentField = '';
            let currentValue = '';
            let braceCount = 0;
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                
                if (line.includes('=')) {
                    // 新しいフィールド
                    if (currentField) {
                        fields[currentField] = this.cleanValue(currentValue);
                    }
                    
                    const parts = line.split('=');
                    currentField = parts[0].trim();
                    currentValue = parts.slice(1).join('=').trim();
                    
                    // 中括弧の数をカウント
                    braceCount = (currentValue.match(/\{/g) || []).length - (currentValue.match(/\}/g) || []).length;
                    
                    if (braceCount === 0 && currentValue.endsWith(',')) {
                        fields[currentField] = this.cleanValue(currentValue.slice(0, -1));
                        currentField = '';
                        currentValue = '';
                    }
                } else if (currentField) {
                    currentValue += ' ' + line;
                    braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                    
                    if (braceCount === 0 && line.endsWith(',')) {
                        fields[currentField] = this.cleanValue(currentValue.slice(0, -1));
                        currentField = '';
                        currentValue = '';
                    }
                }
            }
            
            if (currentField) {
                fields[currentField] = this.cleanValue(currentValue);
            }
            
            console.log(`Parsed publication: ${key}, fields:`, fields);
            this.publications.push({
                type: type,
                key: key,
                fields: fields
            });
        });
        
        // 年でソート（新しい順）
        this.publications.sort((a, b) => {
            const yearA = parseInt(a.fields.year) || 0;
            const yearB = parseInt(b.fields.year) || 0;
            return yearB - yearA;
        });
    }

    cleanValue(value) {
        if (!value) return '';
        
        return value
            .replace(/^\{+|\}+$/g, '') // 先頭と末尾の中括弧を複数回削除
            .replace(/^["']|["']$/g, '') // 引用符を削除
            .replace(/\s+/g, ' ') // 複数の空白を1つに
            .replace(/\n/g, ' ') // 改行を空白に
            .trim();
    }

    formatPublication(pub, index) {
        const rawAuthors = this.cleanValue(pub.fields.author || '');
        const title = this.cleanValue(pub.fields.title || '');
        const journal = this.cleanValue(pub.fields.journal || pub.fields.booktitle || '');
        const year = this.cleanValue(pub.fields.year || '');
        const volume = this.cleanValue(pub.fields.volume || '');
        const number = this.cleanValue(pub.fields.number || '');
        const pages = this.cleanValue(pub.fields.pages || '');
        const note = this.cleanValue(pub.fields.note || '');
        const doi = this.cleanValue(pub.fields.doi || '');
        const url = this.cleanValue(pub.fields.url || '');
        
        // 日本語の著者名を適切に処理
        let authors = rawAuthors;
        if (rawAuthors.includes('三浦') || rawAuthors.includes('木村') || rawAuthors.includes('平田') || 
            rawAuthors.includes('加重') || rawAuthors.includes('橘') || rawAuthors.includes('宇野') ||
            rawAuthors.includes('狭間') || rawAuthors.includes('石川') || rawAuthors.includes('伊藤') ||
            rawAuthors.includes('虻川') || rawAuthors.includes('三杉') || rawAuthors.includes('金子') ||
            rawAuthors.includes('西本') || rawAuthors.includes('坂本') || rawAuthors.includes('田淵') ||
            rawAuthors.includes('鎌村') || rawAuthors.includes('常松')) {
            // 日本語の場合は「and」を「，」に置換
            authors = rawAuthors.replace(/\s+and\s+/g, '，');
        }
        
        let journalInfo = journal;
        if (volume) journalInfo += `, vol. ${volume}`;
        if (number) journalInfo += `, no. ${number}`;
        if (pages) journalInfo += `, pp. ${pages}`;
        if (year) journalInfo += `, ${year}`;
        if (note) journalInfo += `, ${note}`;
        
        // DOIまたはURLリンクを追加
        let linkInfo = '';
        if (doi) {
            const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
            linkInfo = ` <a href="${doiUrl}" target="_blank" rel="noopener noreferrer" class="doi-link">DOI</a>`;
        } else if (url) {
            linkInfo = ` <a href="${url}" target="_blank" rel="noopener noreferrer" class="url-link">URL</a>`;
        }
        
        return {
            number: index + 1,
            authors: authors,
            title: title,
            journal: journalInfo + linkInfo,
            year: year
        };
    }
}

// 動的番号管理機能
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOMContentLoaded event fired');
    const parser = new BibTeXParser();
    const publications = await parser.loadBibTeX();
    console.log('Loaded publications:', publications);
    
    if (publications.length > 0) {
        updatePublicationsFromBibTeX(publications);
    } else {
        console.log('No publications found, updating numbers only');
        updatePublicationNumbers();
    }
});

function updatePublicationsFromBibTeX(publications) {
    const publicationsList = document.querySelector('.publications-list');

    if (!publicationsList) {
        console.error('Publications list element not found!');
        return;
    }
    
    // 既存の論文をクリア
    publicationsList.innerHTML = '';
    
    // カテゴリ別に分類
    const categories = {
        journal: { name: '論文誌', publications: [] },
        international_reviewed: { name: '国際会議（査読有）', publications: [] },
        international_other: { name: '国際会議（その他）', publications: [] },
        domestic: { name: '国内発表', publications: [] },
        grant: { name: '研究助成等', publications: [] }
    };
    
    // cleanValue関数を定義
    function cleanValue(value) {
        if (!value) return '';
        
        return value
            .replace(/^[\{\s]+|[\}\s]+$/g, '') // 先頭と末尾の中括弧と空白を削除
            .replace(/^["']|["']$/g, '') // 引用符を削除
            .replace(/\s+/g, ' ') // 複数の空白を1つに
            .replace(/\n/g, ' ') // 改行を空白に
            .trim();
    }
    
    // 論文をカテゴリ別に分類
    publications.forEach((pub, index) => {
        const category = cleanValue(pub.fields.category || 'international_reviewed');
        
        if (categories[category]) {
            categories[category].publications.push({ pub, index });
        } else {
            console.warn(`Unknown category: ${category}`);
        }
    });
    
    // 全体の連続番号を管理
    let globalNumber = 1;
    
    // 各カテゴリを表示
    Object.keys(categories).forEach(categoryKey => {
        const category = categories[categoryKey];
        
        if (category.publications.length > 0) {
            // カテゴリヘッダー
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'publication-category';
            categoryHeader.innerHTML = `<h4>${category.name}</h4>`;
            publicationsList.appendChild(categoryHeader);
            
            // カテゴリ内の論文
            category.publications.forEach(({ pub, index }) => {
                const parser = new BibTeXParser();
                const formatted = parser.formatPublication(pub, globalNumber - 1); // 全体の番号を使用
                
                const publicationItem = document.createElement('div');
                publicationItem.className = 'publication-item';
                publicationItem.setAttribute('data-year', formatted.year);
                
                publicationItem.innerHTML = `
                    <span class="pub-number">[${globalNumber}]</span>
                    <div class="pub-details">
                        <p class="pub-authors">${formatted.authors}</p>
                        <p class="pub-title">${formatted.title}</p>
                        <p class="pub-journal">${formatted.journal}</p>
                    </div>
                `;
                
                publicationsList.appendChild(publicationItem);
                globalNumber++; // 次の番号に進む
            });
        }
    });
}

function updatePublicationNumbers() {
    const publications = document.querySelectorAll('.publication-item');
    let currentNumber = 1;
    
    publications.forEach(function(publication) {
        const numberElement = publication.querySelector('.pub-number');
        numberElement.textContent = `[${currentNumber}]`;
        currentNumber++;
    });
}

// 新しい論文を追加する関数（BibTeX形式）
function addBibTeXEntry(bibEntry) {
    const parser = new BibTeXParser();
    parser.parseBibTeX(bibEntry);
    
    if (parser.publications.length > 0) {
        const newPub = parser.publications[0];
        const publicationsList = document.querySelector('.publications-list');
        
        const publicationItem = document.createElement('div');
        publicationItem.className = 'publication-item';
        publicationItem.setAttribute('data-year', newPub.fields.year || '');
        
        const formatted = parser.formatPublication(newPub, 0);
        publicationItem.innerHTML = `
            <span class="pub-number">[1]</span>
            <div class="pub-details">
                <p class="pub-authors">${formatted.authors}</p>
                <p class="pub-title">${formatted.title}</p>
                <p class="pub-journal">${formatted.journal}</p>
            </div>
        `;
        
        // 最新の論文を最初に挿入
        publicationsList.insertBefore(publicationItem, publicationsList.firstChild);
        
        // 番号を再計算
        updatePublicationNumbers();
    }
}

// 従来の関数（後方互換性のため）
function addPublication(authors, title, journal, year) {
    const publicationsList = document.querySelector('.publications-list');
    const newPublication = document.createElement('div');
    newPublication.className = 'publication-item';
    newPublication.setAttribute('data-year', year);
    
    newPublication.innerHTML = `
        <span class="pub-number">[0]</span>
        <div class="pub-details">
            <p class="pub-authors">${authors}</p>
            <p class="pub-title">${title}</p>
            <p class="pub-journal">${journal}</p>
        </div>
    `;
    
    // 最新の論文を最初に挿入
    publicationsList.insertBefore(newPublication, publicationsList.firstChild);
    
    // 番号を再計算
    updatePublicationNumbers();
}
