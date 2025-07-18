#!/bin/bash

echo "🔍 DeFi Scanner 应用验证和修复脚本"
echo "====================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查应用是否安装
echo -e "${BLUE}1. 检查应用安装状态...${NC}"
if [ -d "/Applications/DeFi Scanner.app" ]; then
    echo -e "✅ ${GREEN}应用已安装: /Applications/DeFi Scanner.app${NC}"
else
    echo -e "❌ ${RED}应用未安装，请先安装应用${NC}"
    exit 1
fi

# 检查并创建用户数据目录
echo -e "\n${BLUE}2. 检查数据目录...${NC}"
USER_DATA_DIR="$HOME/Library/Application Support/debank-scanner"
DATA_DIR="$USER_DATA_DIR/data"

if [ -d "$USER_DATA_DIR" ]; then
    echo -e "✅ ${GREEN}用户数据目录存在: $USER_DATA_DIR${NC}"
else
    echo -e "⚠️  ${YELLOW}用户数据目录不存在，正在创建...${NC}"
    mkdir -p "$USER_DATA_DIR"
    if [ $? -eq 0 ]; then
        echo -e "✅ ${GREEN}用户数据目录创建成功${NC}"
    else
        echo -e "❌ ${RED}用户数据目录创建失败${NC}"
        exit 1
    fi
fi

if [ -d "$DATA_DIR" ]; then
    echo -e "✅ ${GREEN}数据目录存在: $DATA_DIR${NC}"
    
    # 检查权限
    if [ -w "$DATA_DIR" ]; then
        echo -e "✅ ${GREEN}数据目录有写入权限${NC}"
    else
        echo -e "⚠️  ${YELLOW}数据目录没有写入权限，正在修复...${NC}"
        chmod 755 "$DATA_DIR"
        echo -e "✅ ${GREEN}权限修复完成${NC}"
    fi
    
    # 列出数据文件
    echo -e "\n📄 ${BLUE}数据文件:${NC}"
    ls -la "$DATA_DIR" 2>/dev/null || echo "   (数据目录为空)"
else
    echo -e "⚠️  ${YELLOW}数据目录不存在，正在创建...${NC}"
    mkdir -p "$DATA_DIR"
    chmod 755 "$DATA_DIR"
    if [ $? -eq 0 ]; then
        echo -e "✅ ${GREEN}数据目录创建成功${NC}"
    else
        echo -e "❌ ${RED}数据目录创建失败${NC}"
        exit 1
    fi
fi

# 检查Node.js和npm
echo -e "\n${BLUE}3. 检查开发环境...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "✅ ${GREEN}Node.js 已安装: $NODE_VERSION${NC}"
else
    echo -e "❌ ${RED}Node.js 未安装${NC}"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "✅ ${GREEN}npm 已安装: $NPM_VERSION${NC}"
else
    echo -e "❌ ${RED}npm 未安装${NC}"
fi

# 检查Playwright安装
echo -e "\n${BLUE}4. 检查Playwright环境...${NC}"
if command -v npx &> /dev/null; then
    echo -e "✅ ${GREEN}npx 可用${NC}"
    
    # 检查Playwright是否安装
    if npx playwright --version &> /dev/null; then
        PLAYWRIGHT_VERSION=$(npx playwright --version)
        echo -e "✅ ${GREEN}Playwright 已安装: $PLAYWRIGHT_VERSION${NC}"
        
        # 检查浏览器安装
        echo -e "\n🔍 ${BLUE}检查Playwright浏览器...${NC}"
        PLAYWRIGHT_CACHE="$HOME/Library/Caches/ms-playwright"
        if [ -d "$PLAYWRIGHT_CACHE" ]; then
            echo -e "✅ ${GREEN}Playwright 缓存目录存在${NC}"
            
            # 查找chromium安装
            CHROMIUM_DIRS=$(find "$PLAYWRIGHT_CACHE" -name "chromium*" -type d 2>/dev/null)
            if [ -n "$CHROMIUM_DIRS" ]; then
                echo -e "✅ ${GREEN}找到Chromium安装:${NC}"
                echo "$CHROMIUM_DIRS" | while read dir; do
                    echo -e "   📁 $(basename "$dir")"
                done
                
                # 检查版本不匹配问题
                EXPECTED_PATTERN="chromium_headless_shell-1179"
                ACTUAL_PATTERN=$(find "$PLAYWRIGHT_CACHE" -name "chromium_headless_shell-*" -type d 2>/dev/null | head -1)
                
                if [ -n "$ACTUAL_PATTERN" ]; then
                    ACTUAL_VERSION=$(basename "$ACTUAL_PATTERN")
                    if [ "$ACTUAL_VERSION" != "$EXPECTED_PATTERN" ]; then
                        echo -e "⚠️  ${YELLOW}检测到版本不匹配:${NC}"
                        echo -e "   期望: $EXPECTED_PATTERN"
                        echo -e "   实际: $ACTUAL_VERSION"
                        echo -e "\n🔧 ${BLUE}提供修复选项:${NC}"
                        echo -e "   1. 重新安装Playwright (推荐)"
                        echo -e "   2. 创建符号链接"
                        read -p "选择修复方式 (1/2) [1]: " fix_choice
                        fix_choice=${fix_choice:-1}
                        
                        if [ "$fix_choice" = "1" ]; then
                            echo -e "🔄 ${YELLOW}重新安装Playwright...${NC}"
                            npx playwright uninstall --all
                            npx playwright install chromium
                            echo -e "✅ ${GREEN}Playwright重新安装完成${NC}"
                        elif [ "$fix_choice" = "2" ]; then
                            echo -e "🔗 ${YELLOW}创建符号链接...${NC}"
                            cd "$PLAYWRIGHT_CACHE"
                            ln -sf "$ACTUAL_VERSION" "$EXPECTED_PATTERN"
                            echo -e "✅ ${GREEN}符号链接创建完成${NC}"
                        fi
                    else
                        echo -e "✅ ${GREEN}Chromium版本匹配${NC}"
                    fi
                fi
            else
                echo -e "❌ ${RED}未找到Chromium安装，正在安装...${NC}"
                npx playwright install chromium
            fi
        else
            echo -e "❌ ${RED}Playwright缓存目录不存在，正在安装浏览器...${NC}"
            npx playwright install chromium
        fi
    else
        echo -e "❌ ${RED}Playwright 未安装${NC}"
        echo -e "🔧 ${YELLOW}请运行: npm install && npx playwright install${NC}"
    fi
else
    echo -e "❌ ${RED}npx 不可用${NC}"
fi

# 总结和启动建议
echo -e "\n${BLUE}5. 验证总结和下一步...${NC}"
echo -e "📋 ${BLUE}环境检查完成，建议的测试步骤:${NC}"

echo -e "\n🚀 ${GREEN}启动应用:${NC}"
echo -e "   open '/Applications/DeFi Scanner.app'"

echo -e "\n🧪 ${BLUE}测试流程:${NC}"
echo -e "   1. ${YELLOW}启动应用${NC}"
echo -e "   2. ${YELLOW}点击'开始爬取'按钮${NC}"
echo -e "   3. ${YELLOW}等待爬取完成（约2-3分钟）${NC}"
echo -e "   4. ${YELLOW}检查数据是否正确显示${NC}"
echo -e "   5. ${YELLOW}再次运行此脚本验证数据文件${NC}"

echo -e "\n🔍 ${BLUE}实时监控数据目录:${NC}"
echo -e "   watch 'ls -la \"$DATA_DIR\"'"

echo -e "\n📊 ${BLUE}手动检查数据文件:${NC}"
echo -e "   cat \"$DATA_DIR/debank-latest.json\" | head -20"

echo -e "\n🔧 ${BLUE}常见问题解决:${NC}"
echo -e "   • ${YELLOW}数据目录权限问题:${NC} chmod -R 755 \"$USER_DATA_DIR\""
echo -e "   • ${YELLOW}Playwright重新安装:${NC} npx playwright uninstall --all && npx playwright install"
echo -e "   • ${YELLOW}清理重新构建:${NC} rm -rf out dist && npm run build-electron"

echo -e "\n✨ ${GREEN}脚本执行完成！如果遇到问题，请查看上述修复建议。${NC}" 