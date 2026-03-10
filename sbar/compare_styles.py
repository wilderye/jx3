"""
对比原版 .bak 文件和新版 .vue 文件中的 CSS 类名差异
对每个组件进行逐元素对比，找出不一致的地方
"""
import re
import os
import sys

BASE = r"e:\游戏文档\酒馆\antigravity\j3\tavern_helper_template-main\src\状态栏"

# 文件对照表：(原版文件, 新版文件, 对比说明)
FILE_PAIRS = [
    ("components/status-header.js.bak", "components/StatusHeader.vue", "StatusHeader"),
    ("components/tianxia-menu.js.bak", "components/TianxiaMenu.vue", "TianxiaMenu"),
    ("components/character-view.js.bak", "components/CharacterContent.vue", "CharacterContent"),
    ("components/character-view.js.bak", "components/SectIconBackground.vue", "SectIconBackground"),
    ("components/events-view.js.bak", "components/EventsView.vue", "EventsView"),
    ("components/events-view.js.bak", "components/EventCarousel.vue", "EventCarousel"),
    ("app.js.bak", "App.vue", "App"),
]


def normalize_classes(cls_str):
    """将 class 字符串规范化为排序后的集合"""
    classes = cls_str.strip().split()
    return sorted(set(classes))


def extract_bak_classes(content):
    """从 .bak 文件中提取所有 className 定义"""
    results = []
    # 匹配 className="..." 和 className=${...}
    # 模式1: className="固定字符串"
    for m in re.finditer(r'className="([^"]+)"', content):
        results.append(("static", m.group(1), m.start()))
    # 模式2: className=${...} (动态)
    for m in re.finditer(r'className=\$\{([^}]+)\}', content):
        results.append(("dynamic", m.group(1).strip(), m.start()))
    # 模式3: style=${{...}}  (内联样式)
    for m in re.finditer(r'style=\$\{\{([^}]+(?:\}[^}]+)*)\}\}', content, re.DOTALL):
        results.append(("style", m.group(1).strip(), m.start()))
    return results


def extract_vue_classes(content):
    """从 .vue 文件中提取所有 class 和 :class 定义"""
    results = []
    # 模式1: class="..." (静态)
    for m in re.finditer(r'\bclass="([^"]+)"', content):
        results.append(("static", m.group(1), m.start()))
    # 模式2: :class="..." (动态)
    for m in re.finditer(r':class="([^"]+)"', content):
        results.append(("dynamic", m.group(1).strip(), m.start()))
    # 模式3: style="..." (内联样式)
    for m in re.finditer(r'\bstyle="([^"]+)"', content):
        results.append(("style", m.group(1).strip(), m.start()))
    # 模式4: :style="..." (动态内联样式)
    for m in re.finditer(r':style="([^"]+)"', content):
        results.append(("dyn_style", m.group(1).strip(), m.start()))
    return results


def extract_lines_context(content, pos, context_chars=80):
    """获取给定位置附近的内容作为上下文"""
    start = max(0, pos - 20)
    end = min(len(content), pos + context_chars)
    snippet = content[start:end].replace('\n', ' ').replace('\r', '').strip()
    return snippet


def compare_class_strings(bak_cls, vue_cls):
    """比较两个类字符串，返回差异"""
    bak_set = set(bak_cls.strip().split())
    vue_set = set(vue_cls.strip().split())
    only_bak = bak_set - vue_set
    only_vue = vue_set - bak_set
    return only_bak, only_vue


def main():
    print("=" * 100)
    print("CSS 类名对比报告：原版 .bak vs 新版 .vue")
    print("=" * 100)

    total_diffs = 0

    for bak_file, vue_file, label in FILE_PAIRS:
        bak_path = os.path.join(BASE, bak_file)
        vue_path = os.path.join(BASE, vue_file)

        if not os.path.exists(bak_path):
            print(f"\n⚠️ 缺少原版文件: {bak_file}")
            continue
        if not os.path.exists(vue_path):
            print(f"\n⚠️ 缺少新版文件: {vue_file}")
            continue

        with open(bak_path, "r", encoding="utf-8") as f:
            bak_content = f.read()
        with open(vue_path, "r", encoding="utf-8") as f:
            vue_content = f.read()

        bak_entries = extract_bak_classes(bak_content)
        vue_entries = extract_vue_classes(vue_content)

        print(f"\n{'─' * 100}")
        print(f"📦 组件: {label}")
        print(f"   原版: {bak_file} ({len(bak_entries)} 个样式定义)")
        print(f"   新版: {vue_file} ({len(vue_entries)} 个样式定义)")
        print(f"{'─' * 100}")

        # 提取所有静态 class 字符串并逐一比较
        bak_static = [(typ, val, pos) for typ, val, pos in bak_entries if typ == "static"]
        vue_static = [(typ, val, pos) for typ, val, pos in vue_entries if typ == "static"]

        # 逐对比较同类型的 class 定义
        # 先按内容分组建立映射
        bak_class_sets = {}
        for _, val, pos in bak_static:
            ctx = extract_lines_context(bak_content, pos, 120)
            bak_class_sets[pos] = {"classes": val, "context": ctx}

        vue_class_sets = {}
        for _, val, pos in vue_static:
            ctx = extract_lines_context(vue_content, pos, 120)
            vue_class_sets[pos] = {"classes": val, "context": ctx}

        # 对所有原版的 static class，尝试在新版中找到对应的
        # 去重后的类字符串列表
        bak_unique = []
        seen = set()
        for _, val, pos in bak_static:
            key = ' '.join(sorted(val.split()))
            if key not in seen:
                seen.add(key)
                bak_unique.append(val)

        vue_unique = []
        seen2 = set()
        for _, val, pos in vue_static:
            key = ' '.join(sorted(val.split()))
            if key not in seen2:
                seen2.add(key)
                vue_unique.append(val)

        # 精确匹配
        bak_normalized = {' '.join(sorted(v.split())): v for v in bak_unique}
        vue_normalized = {' '.join(sorted(v.split())): v for v in vue_unique}

        bak_keys = set(bak_normalized.keys())
        vue_keys = set(vue_normalized.keys())

        matched = bak_keys & vue_keys
        only_in_bak = bak_keys - vue_keys
        only_in_vue = vue_keys - bak_keys

        if matched:
            print(f"\n  ✅ 完全匹配 ({len(matched)} 项):")
            for k in sorted(matched):
                classes = k.split()
                if len(classes) <= 5:
                    print(f"     {k}")
                else:
                    print(f"     {' '.join(classes[:5])} ... ({len(classes)} 个类名)")

        # 针对不匹配的进行模糊查找
        diffs_found = []
        used_vue = set()

        for bak_key in sorted(only_in_bak):
            bak_set = set(bak_key.split())
            best_match = None
            best_overlap = 0

            for vue_key in only_in_vue:
                if vue_key in used_vue:
                    continue
                vue_set = set(vue_key.split())
                overlap = len(bak_set & vue_set)
                # 至少有50%的类名相同才认为是对应的
                if overlap > best_overlap and overlap >= max(1, len(bak_set) * 0.4):
                    best_overlap = overlap
                    best_match = vue_key

            if best_match:
                used_vue.add(best_match)
                bak_set = set(bak_key.split())
                vue_set = set(best_match.split())
                lost = bak_set - vue_set
                added = vue_set - bak_set
                if lost or added:
                    diffs_found.append({
                        "bak": bak_normalized[bak_key],
                        "vue": vue_normalized[best_match],
                        "lost": lost,
                        "added": added,
                    })
            else:
                diffs_found.append({
                    "bak": bak_normalized[bak_key],
                    "vue": None,
                    "lost": bak_set,
                    "added": set(),
                })

        # 新版独有的
        remaining_vue = only_in_vue - used_vue
        for vue_key in sorted(remaining_vue):
            vue_set = set(vue_key.split())
            # 检查是否和某个 bak 条目部分匹配
            is_new = True
            for bak_key in bak_keys:
                bak_set = set(bak_key.split())
                if len(bak_set & vue_set) >= len(vue_set) * 0.5:
                    is_new = False
                    break
            if is_new:
                diffs_found.append({
                    "bak": None,
                    "vue": vue_normalized[vue_key],
                    "lost": set(),
                    "added": vue_set,
                })

        if diffs_found:
            total_diffs += len(diffs_found)
            print(f"\n  ⚠️  差异 ({len(diffs_found)} 项):")
            for i, d in enumerate(diffs_found, 1):
                print(f"\n  ── 差异 {i} ──")
                if d["bak"]:
                    print(f"  原版: {d['bak']}")
                else:
                    print(f"  原版: (无对应)")
                if d["vue"]:
                    print(f"  新版: {d['vue']}")
                else:
                    print(f"  新版: (无对应)")
                if d["lost"]:
                    print(f"  ❌ 丢失: {' '.join(sorted(d['lost']))}")
                if d["added"]:
                    print(f"  ➕ 新增: {' '.join(sorted(d['added']))}")
        else:
            print(f"\n  ✅ 所有静态类名完全匹配！")

        # 对比 style 定义
        bak_styles = [(typ, val, pos) for typ, val, pos in bak_entries if typ == "style"]
        vue_styles = [(typ, val, pos) for typ, val, pos in vue_entries if typ in ("style", "dyn_style")]

        if bak_styles or vue_styles:
            print(f"\n  📝 内联样式对比:")
            print(f"     原版: {len(bak_styles)} 处内联样式")
            print(f"     新版: {len(vue_styles)} 处内联样式")

        # 对比动态 class
        bak_dynamic = [(typ, val, pos) for typ, val, pos in bak_entries if typ == "dynamic"]
        vue_dynamic = [(typ, val, pos) for typ, val, pos in vue_entries if typ == "dynamic"]

        if bak_dynamic or vue_dynamic:
            print(f"\n  🔄 动态类名对比:")
            for _, val, pos in bak_dynamic:
                ctx = extract_lines_context(bak_content, pos, 60)
                # 提取动态类名中的静态部分
                static_parts = re.findall(r'"([^"]+)"', val)
                for sp in static_parts:
                    sp_norm = ' '.join(sorted(sp.split()))
                    # 在 vue 动态类名中查找
                    found = False
                    for _, vval, _ in vue_dynamic:
                        if sp in vval or sp_norm in vval:
                            found = True
                            break
                    # 也在静态类名中查找
                    if not found:
                        for _, vval, _ in vue_static:
                            if sp_norm == ' '.join(sorted(vval.split())):
                                found = True
                                break
                    if not found and len(sp.split()) >= 3:
                        print(f"     ⚠️  原版动态类 \"{sp}\" 可能在新版中缺失")
                        total_diffs += 1

    print(f"\n{'=' * 100}")
    print(f"总计发现 {total_diffs} 处差异")
    print(f"{'=' * 100}")


if __name__ == "__main__":
    main()
