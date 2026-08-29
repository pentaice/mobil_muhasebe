const fs = require('fs');

const path = 'src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

// interface
content = content.replace(/(delete:\s*string;)/g, "$1\n  categoryNamePlaceholder: string;\n  createCategory: string;");

// tr
content = content.replace(/(delete:\s*'Sil',)/g, "$1\n    categoryNamePlaceholder: 'Kategori Adı',\n    createCategory: 'Kategori Oluştur',");

// en and others (we injected these using safe_inject.cjs which only put delete: 'Delete' for ALL languages including en, es, etc via the regex)
content = content.replace(/(delete:\s*'Delete',)/g, "$1\n    categoryNamePlaceholder: 'Category Name',\n    createCategory: 'Create Category',");

fs.writeFileSync(path, content, 'utf8');

const cvPath = 'src/components/CategoriesView.tsx';
let cvContent = fs.readFileSync(cvPath, 'utf8');
cvContent = cvContent.replace(/import \{.*?ChevronUp,.*?ChevronUp,.*\} from 'lucide-react';/g, function(match) {
    return match.replace(/ChevronUp,\s*/, '');
});
fs.writeFileSync(cvPath, cvContent, 'utf8');

console.log("Fixed translations and duplicate imports!");
