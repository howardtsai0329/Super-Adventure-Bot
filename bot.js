(function() {

    console.log("[BOT] Starting Adventure Auto Bot...");
    window.confirm = () => true

    /******************************
     * CONFIG
     ******************************/
    const HP_THRESHOLD_SHORT = 0.7;  // Short Rest when HP < 70%
    const HP_THRESHOLD_LONG = 0.3;  // Long Rest when HP < 30%
    const ACTION_INTERVAL = 500; // 0.5 seconds
    const KEEP_SAME_LEVEL_AMOUNT = 10;
    const SAFE_ENHANCE_LEVEL = 4;
    const BOSS_WINRATE_SETTING = 0.85;

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

    function getOpenedEquipmentStat() {
        let currentEquipmentStats = {
            "Attack": Number(document.querySelectorAll(".stat-bonuses .stat-value")[0].textContent),
            "Defence": Number(document.querySelectorAll(".stat-bonuses .stat-value")[1].textContent),
            "Rarity": document.querySelector(".equipment-details .equipment-stats").querySelector("span#equipment-rarity").classList[1],
            "Type": document.querySelector(".equipment-details .equipment-stats").querySelector("span#equipment-type").textContent
        }
        return currentEquipmentStats;
    }

    function getEquipedItemsStats() {
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
            openedEquipmentStat = getOpenedEquipmentStat();
            currentEquipmentStats["currentWeaponStat"] = openedEquipmentStat["Attack"];
            currentEquipmentStats["currentWeaponRarity"] = openedEquipmentStat["Rarity"];
            closebtn.click();
        }

        if (equipedItems[1].classList.length == 1){
            equipedItems[1].click();
            openedEquipmentStat = getOpenedEquipmentStat();
            currentEquipmentStats["currentArmorStat"] = openedEquipmentStat["Defence"];
            currentEquipmentStats["currentArmorRarity"] = openedEquipmentStat["Rarity"];
            closebtn.click();
        }

        if (equipedItems[2].classList.length == 1){
            equipedItems[2].click();
            openedEquipmentStat = getOpenedEquipmentStat();
            currentEquipmentStats["currentAccessoryAtkStat"] = openedEquipmentStat["Attack"];
            currentEquipmentStats["currentAccessoryDefStat"] = openedEquipmentStat["Defence"];
            currentEquipmentStats["currentArmorRarity"] = openedEquipmentStat["Rarity"];
            closebtn.click();
        }

        console.log("[BOT] Checked Current Equipment Stats:", currentEquipmentStats);
        return currentEquipmentStats;
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
        
        return rarityOrder[s1] > rarityOrder[s2];
    }

    function compareUpgradePriority(s1, s2){
        const priority = {
            "防具": 1,
            "武器": 2,
            "飾品": 3
        };

        if (!(s1 in priority) || !(s2 in priority)) {
            return false;
        }
        
        return priority[s1] > priority[s2];
    }


    function getScrollCount(){
        return Number(document.querySelector("#scroll-count").textContent);
    }

    function getCurrentItemEnhanceLevel(){
        return Number(document.querySelector("#equipment-enhance-level").textContent);
    }

    function getLowestEquipedLevel(){
        const equipedItems = document.querySelectorAll(".equipment-slots .equipment-slot .slot-item");
        const closebtn = document.querySelector("#close-equipment-detail");
        
        let lowestEquipedLevel = SAFE_ENHANCE_LEVEL + 1;

        for (let i = 0; i < 3; i++) {
            if (equipedItems[i].classList.length == 1) {
                equipedItems[i].click();
                lowestEquipedLevel = Math.min(lowestEquipedLevel, getCurrentItemEnhanceLevel());
                closebtn.click();
            }
        }
        return lowestEquipedLevel;
    }


    /******************************
     * MAIN FUNCTIONS
     ******************************/

    // Decide what action to take
    function chooseAdventure() {
        console.log("[BOT] Deciding adventure...");
        const hpRatio = getHP();

        // Long rest if below 30% health
        if (hpRatio < HP_THRESHOLD_LONG) {
            console.log(`[BOT] HP low (${Math.round(hpRatio*100)}%). Long Resting.`);
            document.querySelector("#long-rest").click();
            return;
        }
        
        // Short rest if below 70% health
        if (hpRatio < HP_THRESHOLD_SHORT) {
            console.log(`[BOT] HP semi-low (${Math.round(hpRatio*100)}%). Short Resting.`);
            document.querySelector("#short-rest").click();
            return;
        }

        // Go into boss fight if the win-rate is higher than the set level
        if (document.querySelector("#boss-challenge").className != "btn-disabled") {
            document.querySelector("#boss-challenge").click();
            // Extract the number inside parentheses
            let winRate = Number(document.querySelector("span#win-chance").textContent.match(/\((\d+)%\)/)[1]) / 100;

            if (winRate >= 0.85) {
                document.querySelector("#confirm-boss-challenge").click();
                console.log("[BOT] Win-rate is ", winRate * 100, "%, starting boss fight");
                return;
            } else {
                document.querySelector("#cancel-boss-challenge").click();
                console.log("[BOT] Win-rate is ", winRate * 100, "%, aborting boss fight");
            }
        }
        
        // Go to resource adventure if current equipment is not yet +5
        if (getLowestEquipedLevel() <= SAFE_ENHANCE_LEVEL && document.querySelector("#resource-adventure").className != "btn-disabled") {
            document.querySelector("#resource-adventure").click();
            console.log("[BOT] Starting Resource Adventure");
            return;
        }

        // Deep adventure if player level is greater than 3
        if (Number(document.querySelector("span#player-level").textContent) >= 3){
            document.querySelector("#deep-adventure").click();
            console.log("[BOT] Starting Deep Adventure");
            return;
        }

        // Default to simple adventure
        document.querySelector("#simple-adventure").click();
        console.log("[BOT] Starting Simple Adventure");
        return;
    }

    function equipBestInSlot(){
        let currentEquipmentStats = getEquipedItemsStats();
        let currentInventoryItems = document.querySelector(".inventory-items").children;
        let currentSelectedItemStat = null;
        const closebtn = document.querySelector("#close-equipment-detail");
        const equipbtn = document.querySelector("#equip-item");

        console.log("Checking best in slot item...");

        let bestItem = {
            "bestWeaponAtk": currentEquipmentStats["currentWeaponStat"],
            "bestWeaponPos": -1,
            "bestArmorDef": currentEquipmentStats["currentArmorStat"],
            "bestArmorPos": -1,
            "bestAccessoryStat": currentEquipmentStats["currentAccessoryAtkStat"] * 5 + currentEquipmentStats["currentAccessoryDefStat"],
            "bestAccessoryPos": -1
        };

        // Compare Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();
            if (document.querySelector(".modal#equipment-detail-modal").style.cssText != "display: none;"){
                currentSelectedItemStat = getOpenedEquipmentStat();

                // Ignore if the equipment is too high-level
                if (equipbtn.disabled){
                    closebtn.click();
                    continue;
                }
                
                // Store item stat and position if its stat is better
                if (currentSelectedItemStat["Type"] == "武器") {
                    if (currentSelectedItemStat["Attack"] > bestItem["bestWeaponAtk"]) {
                        bestItem["bestWeaponPos"] = i;
                    }
                } else if (currentSelectedItemStat["Type"] == "防具") {
                    if (currentSelectedItemStat["Defence"] > bestItem["bestArmorDef"]) {
                        bestItem["bestArmorPos"] = i;
                    }
                } else if (currentSelectedItemStat["Type"] == "飾品") {
                    if (currentSelectedItemStat["Attack"] * 5 + currentSelectedItemStat["Defence"] > bestItem["bestAccessoryStat"]) {
                        bestItem["bestAccessoryPos"] = i;
                    }
                }
            }
            closebtn.click();
        }

        // Sort by descending order
        let toBeEquip = [bestItem["bestWeaponPos"], bestItem["bestArmorPos"], bestItem["bestAccessoryPos"]];
        toBeEquip = toBeEquip.filter(n => n >= 0).sort((a, b) => b - a);
        for (let pos in toBeEquip){
            currentInventoryItems[pos].click();
            equipbtn.click();
            console.log("[BOT] Equipped New Item"); // TO-DO: add item name
        }
    }

    function deleteWorseItems() {
        let currentEquipmentStats = getEquipedItemsStats();
        let currentInventoryItems = document.querySelector(".inventory-items").children;
        let currentSelectedItemStat = null;
        const closebtn = document.querySelector("#close-equipment-detail");
        const equipbtn = document.querySelector("#equip-item");
        const deletebtn = document.querySelector("#delete-item");

        console.log("Deleting worse items...");

        let allWeapons = {};
        let allArmors = {};
        let allAccessory = {};
        let toBeDelete = [];

        // Store Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();
            if (document.querySelector(".modal#equipment-detail-modal").style.cssText != "display: none;"){
                currentSelectedItemStat = getOpenedEquipmentStat();

                // Ignore if the equipment is too high-level
                if (equipbtn.disabled){
                    closebtn.click();
                    continue;
                }

                // Delete item if its rarity is lower than current equipped item
                if (compareItemRarity(currentEquipmentStats["currentWeaponRarity"], currentSelectedItemStat["Rarity"])) {
                        deletebtn.click();
                        console.log("[BOT] Deleted Item");
                        continue;
                    }
                
                // Store item stat and position
                if (currentSelectedItemStat["Type"] == "武器") {
                    allWeapons[currentSelectedItemStat["Attack"]] = i;
                } else if (currentSelectedItemStat["Type"] == "防具") {
                    allArmors[currentSelectedItemStat["Defence"]] = i;
                } else if (currentSelectedItemStat["Type"] == "飾品") {
                    allAccessory[currentSelectedItemStat["Attack"] * 5 + currentSelectedItemStat["Defence"]] = i;
                }
            }
            closebtn.click();
        }

        if (allWeapons.length > KEEP_SAME_LEVEL_AMOUNT){
            let sortedKeys = Object.keys(allWeapons)
                .map(Number)
                .sort((a, b) => b - a);

            let lastValues = sortedKeys.slice(10).map(key => allWeapons[key]);
            toBeDelete.push(lastValues);
        }

        if (allArmors.length > KEEP_SAME_LEVEL_AMOUNT){
            let sortedKeys = Object.keys(allArmors)
                .map(Number)
                .sort((a, b) => b - a);

            let lastValues = sortedKeys.slice(10).map(key => allArmors[key]);
            toBeDelete.push(lastValues);
        }

        if (allAccessory.length > KEEP_SAME_LEVEL_AMOUNT){
            let sortedKeys = Object.keys(allAccessory)
                .map(Number)
                .sort((a, b) => b - a); 

            let lastValues = sortedKeys.slice(10).map(key => allAccessory[key]);
            toBeDelete.push(lastValues);
        }

        toBeDelete.sort((a, b) => b - a);

        for (let pos in toBeDelete){
            currentInventoryItems[pos].click();
            deletebtn.click();
            console.log("[BOT] Deleted Item"); // TO-DO: add item name
        }
    }

    function enhanceEquipedEquipments(){
        console.log("Leveling up equiped items...");

        if (getScrollCount() == 0){
            console.log("Currently has no scrolls");
            return false;
        }

        const equipedItems = document.querySelectorAll(".equipment-slots .equipment-slot .slot-item");
        const closebtn = document.querySelector("#close-equipment-detail");
        const upgradebtn = document.querySelector("#enhance-equipment");

        if (equipedItems[2].classList.length == 1){
            equipedItems[2].click();
            if(getCurrentItemEnhanceLevel() <= SAFE_ENHANCE_LEVEL) {
                upgradebtn.click();
                console.log("[BOT] Leveled up equipped accessory");
                closebtn.click();
                return true;
            };
            closebtn.click();
        }

        if (equipedItems[0].classList.length == 1){
            equipedItems[0].click();
            if(getCurrentItemEnhanceLevel() <= SAFE_ENHANCE_LEVEL) {
                upgradebtn.click();
                console.log("[BOT] Leveled up equipped weapon");
                closebtn.click();
                return true;
            };
            closebtn.click();
        }

        if (equipedItems[1].classList.length == 1){
            equipedItems[1].click();
            if(getCurrentItemEnhanceLevel() <= SAFE_ENHANCE_LEVEL) {
                upgradebtn.click();
                console.log("[BOT] Leveled up equipped armor");
                closebtn.click();
                return true;
            };
            closebtn.click();
        }

        console.log("All equiped items has reached level 5");
        return false;
    }

    function enhanceBackpackItems(){
        console.log("Leveling up stored items...");

        if (getScrollCount() == 0){
            console.log("Currently has no scrolls");
            return false;
        }

        let currentInventoryItems = document.querySelector(".inventory-items").children;
        const closebtn = document.querySelector("#close-equipment-detail");
        const upgradebtn = document.querySelector("#enhance-equipment");
        let currentSelectedItemStat = null;
        let currentItemLevel = 0;
        let toBeUpgrade = {
            "Rarity": "rarity-common",
            "Level": 0,
            "Type": "防具",
            "Position": -1
        }

       // Store Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();
            if (document.querySelector(".modal#equipment-detail-modal").style.cssText != "display: none;") {
                currentSelectedItemStat = getOpenedEquipmentStat();
                currentItemLevel = getCurrentItemEnhanceLevel();

                if (compareItemRarity(currentSelectedItemStat["Rarity"], toBeUpgrade["rarity"])){
                    toBeUpgrade["Rarity"] = currentSelectedItemStat["Rarity"];
                    toBeUpgrade["Level"] = currentItemLevel;
                    toBeUpgrade["Type"] = currentSelectedItemStat["Type"];
                    toBeUpgrade["Rarity"] = i;
                } else if (currentSelectedItemStat["Rarity"] == toBeUpgrade["rarity"]) {
                    if (toBeUpgrade["Level"] > currentItemLevel){
                        toBeUpgrade["Rarity"] = currentSelectedItemStat["Rarity"];
                        toBeUpgrade["Level"] = currentItemLevel;
                        toBeUpgrade["Type"] = currentSelectedItemStat["Type"];
                        toBeUpgrade["Rarity"] = i;
                    } else if (currentItemLevel == toBeUpgrade["level"] && compareUpgradePriority(currentSelectedItemStat["Type"], toBeUpgrade["Type"])){
                    toBeUpgrade["Rarity"] = currentSelectedItemStat["Rarity"];
                    toBeUpgrade["Level"] = currentItemLevel;
                    toBeUpgrade["Type"] = currentSelectedItemStat["Type"];
                    toBeUpgrade["Rarity"] = i;
                    }
                }
            }
            closebtn.click();
        }

        if (toBeUpgrade["Position"] != -1) {
            currentInventoryItems[toBeUpgrade["Position"]].click();
            upgradebtn.click();
            return true;
        }
        return false;

    }

    function EquipUpgradeAndDeleteItems(){
        while(true){
            equipBestInSlot();
            deleteWorseItems();
            while(enhanceEquipedEquipments()){}
            if(!enhanceBackpackItems()){
                break;
            }
        }
        
    }


    /******************************
     * MAIN LOOP
     ******************************/
    setInterval(() => {

        const hp = getHP();
        const running = isActivityRunning();

        console.log(`[BOT] Tick | HP: ${Math.round(hp*100)}% | Running: ${running}`);
        
        // 1. Equip items first
        EquipUpgradeAndDeleteItems();
        
        if (!running) {
            chooseAdventure();
        }
        
    }, ACTION_INTERVAL);
})();