(function() {

    console.log("[BOT] Starting Adventure Auto Bot...");

    /******************************
     * CONFIG
     ******************************/
    const HP_THRESHOLD_SHORT = 0.7;  // Short Rest when HP < 70%
    const HP_THRESHOLD_LONG = 0.3;  // Long Rest when HP < 30%
    const ACTION_INTERVAL = 500; // 0.5 seconds

    /******************************
     * HELPERS TO GET GAME STATE
     ******************************/

    function getHP() {
        let hpText = document.querySelector(".stat-value");
        if (!hpText) return 1; // fallback to safe value

        let [current, max] = hpText.textContent.trim().split("/").map(Number);
        return current / max;
    }

    function isActivityRunning() {
        const bar = document.querySelector(".activity-progress");
        if (!bar) return false;

        return bar.style.display !== "none";
    }

    function hasUnequippedItems() {
        return !!document.querySelector(".item-notification"); 
    }

    /******************************
     * BUTTON CLICK HELPERS
     ******************************/

    function click(selector) {
        const el = document.querySelector(selector);
        if (el && !el.disabled) {
            console.log("[BOT] Clicking:", selector);
            el.click();
            return true;
        }
        return false;
    }

    function startAdventure() {
        console.log("[BOT] Deciding adventure...");

        // Preferred order: Boss -> Deep -> Simple

        if (document.querySelector("#boss-challenge").click()) {
            console.log("[BOT] Starting Boss Fight");
            return;
        }
        
        if (document.querySelector("#simple-adventure").click()) {
            console.log("[BOT] Starting Simple Adventure");
            return;
        }
    }

    function restIfNeeded(hpRatio) {
        if (hpRatio < HP_THRESHOLD_LONG) {
            console.log(`[BOT] HP low (${Math.round(hpRatio*100)}%). Long Resting.`);
            click("#short-rest");
            return true;
        } else if (hpRatio < HP_THRESHOLD_SHORT) {
            console.log(`[BOT] HP semi-low (${Math.round(hpRatio*100)}%). Short Resting.`);
            click("#short-rest");
            return true;
        }
        return false;
    }

    function copyOpenedEquipmentStat() {
        let currentEquipmentStats = {
            "Attack": Number(document.querySelectorAll(".stat-bonuses .stat-value")[0].textContent),
            "Defence": Number(document.querySelectorAll(".stat-bonuses .stat-value")[1].textContent),
            "Rarity": document.querySelector(".equipment-details .equipment-stats").querySelector("span#equipment-rarity").classList[1],
            "Type": document.querySelector(".equipment-details .equipment-stats").querySelector("span#equipment-type").textContent
        }
        return currentEquipmentStats;
    }

    function checkEquipedItems() {
        const equipedItems = document.querySelectorAll(".equipment-slots .equipment-slot .slot-item");
        const closebtn = document.querySelector("#close-equipment-detail");
        
        let openedEquipmentStat = null;
        let currentEquipmentStats = {
            "currentWeaponStat": 0,
            "currentWeaponRarity": null,
            "currentArmorStat": 0,
            "currentArmorRarity": null,
            "currentAccessoryAtkStat": 0,
            "currentAccessoryDefStat": 0,
            "currentAccessoryRarity": null
        }
        
        if (equipedItems[0].classList.length == 1){
            equipedItems[0].click();
            openedEquipmentStat = copyOpenedEquipmentStat();
            currentEquipmentStats["currentWeaponStat"] = openedEquipmentStat["Attack"];
            currentEquipmentStats["currentWeaponRarity"] = openedEquipmentStat["Rarity"];
            closebtn.click();
        }

        if (equipedItems[1].classList.length == 1){
            equipedItems[1].click();
            openedEquipmentStat = copyOpenedEquipmentStat();
            currentEquipmentStats["currentArmorStat"] = openedEquipmentStat["Defence"];
            currentEquipmentStats["currentArmorRarity"] = openedEquipmentStat["Rarity"];
            closebtn.click();
        }

        if (equipedItems[2].classList.length == 1){
            equipedItems[2].click();
            openedEquipmentStat = copyOpenedEquipmentStat();
            currentEquipmentStats["currentAccessoryAtkStat"] = openedEquipmentStat["Attack"];
            currentEquipmentStats["currentAccessoryDefStat"] = openedEquipmentStat["Defence"];
            currentEquipmentStats["currentArmorRarity"] = openedEquipmentStat["Rarity"];
            closebtn.click();
        }

        console.log("[BOT] Equiped Items: ");
        
        return currentEquipmentStats;
    }

    function equipAndUpgradeItem(){
        let currentEquipmentStats = checkEquipedItems();
        let currentInventoryItems = document.querySelector(".inventory-items").children;
        let currentSelectedItemStat = null;
        const closebtn = document.querySelector("#close-equipment-detail");
        const deletebtn = document.querySelector("#delete-item");
        const upgradebtn = document.querySelector("#enhance-equipment");
        const equipbtn = document.querySelector("#equip-item");

        for (let item of currentInventoryItems){
            item.click();

            // Compare Item Stats
            if (document.querySelector(".modal#equipment-detail-modal").style.cssText != "display: none;"){
                currentSelectedItemStat = copyOpenedEquipmentStat();
                if (equipbtn.disabled){
                    closebtn.click();
                    continue;
                }
                
                // Equip items if better in stats
                if (currentSelectedItemStat["Type"] == "武器") {
                    if (currentSelectedItemStat["Attack"] > currentEquipmentStats["currentWeaponStat"]) {
                        equipbtn.click();
                        return true;
                    }
                } else if (currentSelectedItemStat["Type"] == "防具") {
                    if (currentSelectedItemStat["Defence"] > currentEquipmentStats["currentArmorStat"]) {
                        equipbtn.click();
                        return true;
                    }
                } else {
                    if (currentSelectedItemStat["Attack"] * 5 + currentSelectedItemStat["Defence"] > currentEquipmentStats["currentAccessoryAtkStat"] * 5 + currentEquipmentStats["currentAccessoryDefStat"]) {
                        equipbtn.click();
                        return true;
                    }
                }

                
                // Delete item if worse in rarity, upgrade otherwise
                if (currentSelectedItemStat["Type"] == "武器") {
                    if (!compareItemRarity(currentSelectedItemStat["Rarity"], currentEquipmentStats["currentWeaponRarity"])) {
                        deletebtn.click();
                    } else {
                        closebtn.click(); // TEMP
                        return false; // TEMP
                        if (upgradebtn.disabled){
                            closebtn.click();
                            continue;
                        }
                        upgradebtn.click();
                        closebtn.click();
                    }
                    return true;
                } else if (currentSelectedItemStat["Type"] == "防具") {
                    if (!compareItemRarity(currentSelectedItemStat["Rarity"], currentEquipmentStats["currentArmorRarity"])) {
                        deletebtn.click();
                    } else {
                        closebtn.click(); // TEMP
                        return false; // TEMP
                        if (upgradebtn.disabled){
                            closebtn.click();
                            continue;
                        }
                        upgradebtn.click();
                        closebtn.click();
                    }
                    return true;
                } else {
                    if (!compareItemRarity(currentSelectedItemStat["Rarity"], currentEquipmentStats["currentAccessoryRarity"])) {
                        deletebtn.click();
                    } else {
                        closebtn.click(); // TEMP
                        return false; // TEMP
                        if (upgradebtn.disabled){
                            closebtn.click();
                            continue;
                        }
                        upgradebtn.click();
                        closebtn.click();
                    }
                    return true;
                }
                closebtn.click();
            }
        }
        return false;
    }

    function compareItemRarity(s1, s2){
        const rarityOrder = {
            "rarity-common": 1,
            "rarity-uncommon": 2,
            "rarity-rare": 3,
            "rarity-epic": 4,
            "rarity-legendary": 5
        };

        if (!(s1 in rarityOrder) || !(s2 in rarityOrder)) {
            return false;
        }
        
        return rarityOrder[s1] >= rarityOrder[s2];
    }

    /******************************
     * MAIN LOOP
     ******************************/
    setInterval(() => {

        const hp = getHP();
        const running = isActivityRunning();

        console.log(`[BOT] Tick | HP: ${Math.round(hp*100)}% | Running: ${running}`);
        
        // 1. Equip items first
        if (equipAndUpgradeItem()) return;
        
        if (!running) {
            // 2. Rest if HP low
            if (restIfNeeded(hp)) return;
            startAdventure();
        }
        
    }, ACTION_INTERVAL);
})();