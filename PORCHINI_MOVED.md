# Porchini game — not in CopperHead

The mushroom racer game is **not** part of CopperHead.

| | |
|---|---|
| **GitHub** | https://github.com/uberslaw/PorchiniRocket |
| **Local** | `C:\Porchini Rocket` |

## One-time publish (Windows)

1. Ensure https://github.com/uberslaw/PorchiniRocket exists and your GitHub login can push to it.  
2. Run **`MIGRATE-TO-PORCHINIROCKET.cmd`** from this CopperHead branch (double-click).  
3. It copies the last handoff (`v0.8.1`) into `C:\Porchini Rocket` and pushes `main`.  
4. Delete any `CopperHead-tmp` folders.  
5. Point **RepoSync** at PorchiniRocket → `C:\Porchini Rocket`.  
6. Future Cursor agents: open **`C:\Porchini Rocket`** (or start a cloud agent **on PorchiniRocket**).

Cloud agents started on CopperHead often get a token that can only see CopperHead — they cannot push to PorchiniRocket until a new agent is started on that repo.
