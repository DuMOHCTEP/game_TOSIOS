#!/bin/bash
# Автоматический скрипт для коммита и пуша в ветку production
# Использование: ./git_push_production.sh [сообщение коммита]

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}�� Начинаем автоматический коммит и пуш в production ветку${NC}"

# Настройка Git конфигурации, если не настроена
if [ -z "$(git config user.name)" ]; then
    echo "⚙️  Настраиваем Git конфигурацию..."
    git config user.name "DuMOHCTEP"
    git config user.email "dumohctep@example.com"
    echo -e "${GREEN}✅ Git конфигурация настроена${NC}"
fi

# Проверяем, есть ли изменения для коммита
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Нет изменений для коммита${NC}"
    echo -e "${GREEN}✅ Репозиторий уже актуален${NC}"
    exit 0
fi

# Добавляем все изменения
echo "📁 Добавляем все изменения..."
git add .

# Создаем сообщение коммита
if [ -n "$1" ]; then
    COMMIT_MESSAGE="$1"
else
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    COMMIT_MESSAGE="Auto-commit: $TIMESTAMP"
fi

# Делаем коммит
echo "📝 Создаем коммит с сообщением: '$COMMIT_MESSAGE'"
if git commit -m "$COMMIT_MESSAGE"; then
    echo -e "${GREEN}✅ Коммит успешно создан${NC}"
else
    echo -e "${RED}❌ Ошибка при создании коммита${NC}"
    exit 1
fi

# Пушим в production ветку
echo "⬆️  Пушим изменения в ветку production..."
if git push origin production; then
    echo -e "${GREEN}✅ Успешно запушено в production ветку${NC}"
    echo -e "${GREEN}🔗 Production ветка обновлена!${NC}"
else
    echo -e "${RED}❌ Ошибка при пуше в production ветку${NC}"
    echo -e "${YELLOW}💡 Возможно, нужно сначала сделать pull:${NC}"
    echo "   git pull origin production"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Все операции выполнены успешно!${NC}"
echo "📊 Статус: $(git log --oneline -1)"
