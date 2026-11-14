# Self-hosted font subsets

`noto-sans-ethiopic-core.woff2` is Noto Sans Ethiopic (SIL Open Font License 1.1, © Google / Monotype),
taken from Google Fonts' variable build, limited to weights 400–700 and subset to the core Ge'ez block
(U+1200–137F) plus Latin basics and punctuation. That covers Amharic and Tigrinya and cuts the file
from 198 KB to 80 KB.

Rebuild (needs `pip install fonttools brotli`):

```bash
python3 -m fontTools.varLib.instancer NotoSansEthiopic-variable.woff2 wght=400:700 -o eth.ttf
python3 -m fontTools.subset eth.ttf --unicodes="U+0020-007E,U+00A0,U+00A9,U+00AB,U+00BB,U+1200-137F,U+2013-2014,U+2018-201D,U+2026" --layout-features='*' --flavor=woff2 --output-file=noto-sans-ethiopic-core.woff2
```

License: https://openfontlicense.org
