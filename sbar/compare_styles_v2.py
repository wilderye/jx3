"""
精细对比脚本：逐个 HTML 元素比较原版 .bak 和新版 .vue 的所有属性
考虑组件拆分后的对应关系，按照元素的语义标签进行匹配
"""
import re
import os

BASE = r"e:\游戏文档\酒馆\antigravity\j3\tavern_helper_template-main\src\状态栏"

def read_file(relpath):
    with open(os.path.join(BASE, relpath), "r", encoding="utf-8") as f:
        return f.read()

def extract_elements(content, is_bak=True):
    """提取所有 HTML 元素及其属性，返回 [{tag, classes, style, line, context}]"""
    results = []
    # 匹配开标签
    tag_re = re.compile(r'<(\w+)\s', re.MULTILINE)

    for m in tag_re.finditer(content):
        tag = m.group(1)
        if tag in ('template', 'script', 'slot'):
            continue

        # 找到这个标签的完整开标签内容
        start = m.start()
        depth = 0
        end = start
        in_str = False
        str_char = None
        for i in range(start, min(len(content), start + 2000)):
            c = content[i]
            if in_str:
                if c == str_char and content[i-1] != '\\':
                    in_str = False
            else:
                if c in ('"', "'", '`'):
                    in_str = True
                    str_char = c
                elif c == '>':
                    end = i
                    break

        tag_content = content[start:end+1]
        line_num = content[:start].count('\n') + 1

        # 提取 class/className
        classes = ""
        if is_bak:
            cm = re.search(r'className="([^"]+)"', tag_content)
            if cm:
                classes = cm.group(1)
            else:
                cm = re.search(r'className=\$\{([^}]+)\}', tag_content)
                if cm:
                    # 提取动态类名中的字符串
                    dyn = cm.group(1)
                    parts = re.findall(r'"([^"]+)"', dyn)
                    classes = "DYN: " + " | ".join(parts)
        else:
            cm = re.search(r'\bclass="([^"]+)"', tag_content)
            if cm:
                classes = cm.group(1)
            else:
                cm = re.search(r':class="([^"]*)"', tag_content)
                if cm:
                    dyn = cm.group(1)
                    parts = re.findall(r"'([^']+)'", dyn)
                    classes = "DYN: " + " | ".join(parts)

        # 提取 style
        style = ""
        if is_bak:
            sm = re.search(r'style=\$\{\{([^}]+(?:\}[^}]+)*)\}\}', tag_content, re.DOTALL)
            if sm:
                style = sm.group(1).strip()
        else:
            sm = re.search(r'\bstyle="([^"]+)"', tag_content)
            if sm:
                style = sm.group(1).strip()
            else:
                sm = re.search(r':style="\{([^}]+)\}"', tag_content)
                if sm:
                    style = sm.group(1).strip()

        # 上下文文本（提取标签后的文本内容）
        text_after = content[end+1:end+80].strip().split('<')[0].strip()[:50]

        results.append({
            'tag': tag,
            'classes': classes,
            'style': style,
            'line': line_num,
            'text': text_after,
            'raw': tag_content[:200],
        })

    return results

def normalize_class_set(cls_str):
    """将类字符串转为规范化集合"""
    if cls_str.startswith("DYN:"):
        return cls_str  # 动态类名保持原样
    return ' '.join(sorted(cls_str.split()))

def compare_components(bak_file, vue_files, label):
    """比较一个原版组件与一个或多个 Vue 文件的元素"""
    print(f"\n{'='*90}")
    print(f"📦 {label}")
    print(f"   原版: {bak_file}")
    print(f"   新版: {', '.join(vue_files)}")
    print(f"{'='*90}")

    bak_content = read_file(bak_file)
    bak_elements = extract_elements(bak_content, is_bak=True)

    vue_elements = []
    for vf in vue_files:
        vc = read_file(vf)
        ve = extract_elements(vc, is_bak=False)
        for e in ve:
            e['file'] = vf
        vue_elements.extend(ve)

    print(f"\n   原版元素: {len(bak_elements)}, 新版元素: {len(vue_elements)}")

    diffs = []

    # 对每个原版元素，找到新版中最匹配的对应元素
    used_vue = set()

    for bi, be in enumerate(bak_elements):
        if not be['classes'] and not be['style']:
            continue  # 跳过无样式的元素

        bak_norm = normalize_class_set(be['classes'])

        best_match = None
        best_score = 0

        for vi, ve in enumerate(vue_elements):
            if vi in used_vue:
                continue
            if not ve['classes'] and not ve['style']:
                continue

            vue_norm = normalize_class_set(ve['classes'])

            # 计算匹配分数
            score = 0
            if bak_norm == vue_norm:
                score = 100
            elif be['classes'] and ve['classes']:
                if bak_norm.startswith("DYN:") or vue_norm.startswith("DYN:"):
                    # 动态类名，提取静态部分比较
                    bak_parts = set(re.findall(r'[\w\[\]\-/:\.]+', be['classes']))
                    vue_parts = set(re.findall(r'[\w\[\]\-/:\.]+', ve['classes']))
                    overlap = len(bak_parts & vue_parts)
                    total = max(len(bak_parts), len(vue_parts))
                    if total > 0:
                        score = int(overlap / total * 80)
                else:
                    bak_set = set(bak_norm.split())
                    vue_set = set(vue_norm.split())
                    overlap = len(bak_set & vue_set)
                    total = max(len(bak_set), len(vue_set))
                    if total > 0:
                        score = int(overlap / total * 80)

            # 标签匹配加分
            if be['tag'] == ve['tag']:
                score += 10
            # 文本匹配加分
            if be['text'] and ve['text'] and be['text'][:10] == ve['text'][:10]:
                score += 10

            if score > best_score:
                best_score = score
                best_match = (vi, ve)

        if best_match and best_score >= 40:
            vi, ve = best_match
            used_vue.add(vi)

            # 比较类名差异
            if be['classes'] and ve['classes']:
                if not be['classes'].startswith("DYN:") and not ve['classes'].startswith("DYN:"):
                    bak_set = set(be['classes'].split())
                    vue_set = set(ve['classes'].split())
                    lost = bak_set - vue_set
                    added = vue_set - bak_set
                    if lost or added:
                        diffs.append({
                            'type': 'class_diff',
                            'bak_line': be['line'],
                            'vue_line': ve['line'],
                            'vue_file': ve.get('file', ''),
                            'bak_tag': f"<{be['tag']}>",
                            'text': be['text'] or ve['text'],
                            'lost': lost,
                            'added': added,
                            'bak_full': be['classes'],
                            'vue_full': ve['classes'],
                        })
                else:
                    # 动态类名对比
                    bak_strs = set(re.findall(r'"([^"]+)"', be['classes']))
                    vue_strs = set(re.findall(r"'([^']+)'", ve['classes']))
                    # 逐个字符串比较
                    for bs in bak_strs:
                        found = False
                        for vs in vue_strs:
                            if set(bs.split()) == set(vs.split()):
                                found = True
                                break
                        if not found and len(bs.split()) > 1:
                            diffs.append({
                                'type': 'dyn_class_diff',
                                'bak_line': be['line'],
                                'vue_line': ve['line'],
                                'vue_file': ve.get('file', ''),
                                'bak_tag': f"<{be['tag']}>",
                                'text': be['text'] or ve['text'],
                                'lost': {f'"{bs}"'},
                                'added': set(),
                                'bak_full': be['classes'],
                                'vue_full': ve['classes'],
                            })

            # 比较内联样式
            if be['style'] and not ve['style']:
                diffs.append({
                    'type': 'style_lost',
                    'bak_line': be['line'],
                    'vue_line': ve['line'],
                    'vue_file': ve.get('file', ''),
                    'bak_tag': f"<{be['tag']}>",
                    'text': be['text'] or ve['text'],
                    'lost': {be['style'][:80]},
                    'added': set(),
                    'bak_full': f"style: {be['style'][:120]}",
                    'vue_full': "(无style)",
                })
            elif be['style'] and ve['style']:
                # 比较 style 属性
                bak_props = set(re.findall(r'(\w[\w-]*)\s*:', be['style']))
                vue_props = set(re.findall(r'(\w[\w-]*)\s*:', ve['style']))
                lost_props = bak_props - vue_props
                added_props = vue_props - bak_props
                if lost_props:
                    diffs.append({
                        'type': 'style_prop_diff',
                        'bak_line': be['line'],
                        'vue_line': ve['line'],
                        'vue_file': ve.get('file', ''),
                        'bak_tag': f"<{be['tag']}>",
                        'text': be['text'] or ve['text'],
                        'lost': {f"style.{p}" for p in lost_props},
                        'added': {f"style.{p}" for p in added_props} if added_props else set(),
                        'bak_full': be['style'][:200],
                        'vue_full': ve['style'][:200],
                    })
        else:
            # 未匹配的原版元素
            if be['classes'] and len(be['classes'].split()) >= 3:
                diffs.append({
                    'type': 'no_match',
                    'bak_line': be['line'],
                    'vue_line': 0,
                    'vue_file': '',
                    'bak_tag': f"<{be['tag']}>",
                    'text': be['text'],
                    'lost': set(be['classes'].split()[:5]),
                    'added': set(),
                    'bak_full': be['classes'],
                    'vue_full': "(未找到对应元素)",
                })

    if diffs:
        print(f"\n  ⚠️  发现 {len(diffs)} 处样式差异:\n")
        for i, d in enumerate(diffs, 1):
            print(f"  ── 差异 {i} ({d['type']}) ──")
            print(f"  元素: {d['bak_tag']}  上下文: \"{d['text'][:40]}\"")
            print(f"  原版 L{d['bak_line']}: {d['bak_full'][:120]}")
            if d['vue_file']:
                print(f"  新版 {os.path.basename(d['vue_file'])} L{d['vue_line']}: {d['vue_full'][:120]}")
            else:
                print(f"  新版: {d['vue_full']}")
            if d['lost']:
                print(f"  ❌ 丢失/变化: {', '.join(sorted(d['lost']))}")
            if d['added']:
                print(f"  ➕ 新增: {', '.join(sorted(d['added']))}")
            print()
    else:
        print(f"\n  ✅ 未发现样式差异")

    return diffs

def main():
    print("精细样式对比报告")
    print("=" * 90)

    all_diffs = []

    # StatusHeader
    d = compare_components(
        "components/status-header.js.bak",
        ["components/StatusHeader.vue"],
        "StatusHeader"
    )
    all_diffs.extend(d)

    # TianxiaMenu
    d = compare_components(
        "components/tianxia-menu.js.bak",
        ["components/TianxiaMenu.vue"],
        "TianxiaMenu"
    )
    all_diffs.extend(d)

    # CharacterView → CharacterContent + SectIconBackground
    d = compare_components(
        "components/character-view.js.bak",
        ["components/CharacterContent.vue", "components/SectIconBackground.vue"],
        "CharacterView → CharacterContent + SectIcon"
    )
    all_diffs.extend(d)

    # EventsView → EventsView + EventCarousel
    d = compare_components(
        "components/events-view.js.bak",
        ["components/EventsView.vue", "components/EventCarousel.vue"],
        "EventsView → EventsView + EventCarousel"
    )
    all_diffs.extend(d)

    # App
    d = compare_components(
        "app.js.bak",
        ["App.vue"],
        "App"
    )
    all_diffs.extend(d)

    print(f"\n{'='*90}")
    print(f"总计发现 {len(all_diffs)} 处真正的样式差异")
    print(f"{'='*90}")

if __name__ == "__main__":
    main()
