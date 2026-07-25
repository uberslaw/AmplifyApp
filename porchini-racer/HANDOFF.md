# Handoff → PorchiniRacer

This folder was pushed from the CopperHead cloud agent because that agent
cannot write to https://github.com/uberslaw/PorchiniRacer yet.

## On Mac — publish to PorchiniRacer

```bash
cd ~
git clone https://github.com/uberslaw/CopperHead.git
cd CopperHead
git checkout cursor/mushroom-blaze-racer-dde7
cd ~

git clone https://github.com/uberslaw/PorchiniRacer.git
cd PorchiniRacer
cp -R ~/CopperHead/porchini-racer/* .
cp ~/CopperHead/porchini-racer/.gitignore . 2>/dev/null || true
git add .
git commit -m "Initial Porchini Racer game"
git push -u origin main
npm install
npm run dev
```
