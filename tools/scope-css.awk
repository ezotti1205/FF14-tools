# CSSのセレクタを PFX 配下に限定する。 awk -v PFX="#panel-x" -f scope.awk in.css
{ src = src $0 "\n" }
function trim(s) { gsub(/^[ \t\r\n]+|[ \t\r\n]+$/, "", s); return s }
function prefixSel(sel,   parts, n, i, s, out) {
  n = split(sel, parts, ",")
  out = ""
  for (i = 1; i <= n; i++) {
    s = trim(parts[i])
    if (s == "") continue
    if (s == ":root" || s == "html" || s == "body" || s == "*") s = PFX
    else if (s ~ /^html[ ,]/ || s ~ /^body[ >]/) { sub(/^(html|body)[ \t]*/, "", s); s = PFX " " trim(s) }
    else s = PFX " " s
    out = (out == "" ? s : out ", " s)
  }
  return (out == "" ? PFX : out)
}
END {
  depth = 0
  stack[0] = 1
  buf = ""; out = ""
  n = length(src)
  for (i = 1; i <= n; i++) {
    c = substr(src, i, 1)
    if (c == "{") {
      lead = buf; sub(/[^ \t\r\n].*$/, "", lead)
      body = buf; sub(/^[ \t\r\n]*/, "", body)
      if (stack[depth] == 1) {
        t = trim(body)
        cmts = ""
        p = index(t, "/*")
        while (p > 0) {
          q = index(substr(t, p + 2), "*/")
          if (q == 0) break
          cmts = cmts substr(t, p, q + 3) "\n"
          t = trim(substr(t, 1, p - 1) substr(t, p + q + 3))
          p = index(t, "/*")
        }
        if (substr(t, 1, 1) == "@") {
          out = out cmts lead t " {"
          stack[depth + 1] = (t ~ /^@(media|container|supports|layer)/) ? 1 : 0
        } else {
          out = out cmts lead prefixSel(t) " {"
          stack[depth + 1] = 0
        }
      } else {
        out = out buf "{"
        stack[depth + 1] = 0
      }
      depth++
      buf = ""
    } else if (c == "}") {
      out = out buf "}"
      buf = ""
      if (depth > 0) depth--
    } else {
      buf = buf c
    }
  }
  out = out buf
  printf "%s", out
}
