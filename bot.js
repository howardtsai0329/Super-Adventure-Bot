(function() {

    console.log("[BOT] Starting Adventure Auto Bot...");
    window.confirm = () => true

    /******************************
     * CONFIG
     ******************************/

    const ACTION_INTERVAL = 500; // 0.5 seconds
    const LOG_INTERVAL = 30 * 1000; // 30 seconds

    const HP_THRESHOLD_SHORT = 0.7;  // Short Rest when HP < 70%
    const HP_THRESHOLD_LONG = 0.3;  // Long Rest when HP < 30%
    
    const KEEP_SAME_LEVEL_AMOUNT = 10;
    const SAFE_ENHANCE_LEVEL = 4;
    const BOSS_WINRATE_SETTING = 0.85;
    const HEALTH_PER_ATTACK_POWER = 5;

    const DEBUG = false;


    /******************************
     * GAME CONSTANTS
     ******************************/
    const PLAYER_LEVEL_TAG = "#player-level";
    const HEALTH_TAG = "#health-text";
    const ACTIVITY_PROGRESS_BAR_TAG = "#activity-progress";

    const EQUIPMENT_DETAIL_MODEL_TAG = "#equipment-detail-modal";
    const EQUIPMENT_DETAIL_NAME_TAG = "#equipment-name";
    const EQUIPMENT_DETAIL_ATK_TAG = "#attack-bonus .stat-value";
    const EQUIPMENT_DETAIL_DEF_TAG = "#health-bonus .stat-value";
    const EQUIPMENT_DETAIL_RARITY_TAG = "#equipment-rarity";
    const EQUIPMENT_DETAIL_TYPE_TAG = "#equipment-type";
    const EQUIPMENT_DETAIL_ENHANCE_LEVEL_TAG = "#equipment-enhance-level";

    const RARITY_RANKING = {
        "普通": 1,
        "稀有": 2,
        "史詩": 3,
        "傳說": 4
    };

    const UPGRADE_SCROLL_COUNT_TAG = "#scroll-count";

    const EQUIPED_WEAPON_TAG = "#weapon-slot";
    const EQUIPED_ARMOR_TAG = "#armor-slot";
    const EQUIPED_ACCESSORY_TAG = "#accessory-slot";

    const CLOSE_EQUIPMENT_BUTTON_TAG = "#close-equipment-detail";
    const EQUIP_BUTTON_TAG = "#equip-item";
    const DELETE_ITEM_TAG = "#delete-item";
    const ENHANCE_ITEM_TAG = "#enhance-equipment";

    const SHORT_REST_BUTTON_TAG = "#short-rest";
    const LONG_REST_BUTTON_TAG = "#long-rest";
    const DEEP_ADVENTURE_TAG = "#deep-adventure"
    const SIMPLE_ADVENTURE_TAG = "#simple-adventure"
    const RESOURCE_ADVENTURE_TAG = "#resource-adventure";
    const BOSS_CHALLENGE_TAG = "#boss-challenge";
    const CONFIRM_BOSS_CHALLENGE_TAG = "#confirm-boss-challenge";
    const CANCLE_BOSS_CHALLENGE_TAG = "#cancel-boss-challenge";

    const BOSS_WINRATE_TAG = "#win-chance";

    const INVENTORY_TAG = "#inventory-items"

    /******************************
     * HELPERS TO GET GAME STATE
     ******************************/

    function getPlayerLevel() {
        let levelText = document.querySelector(PLAYER_LEVEL_TAG);
        if (!levelText) {
            console.log("[BOT ERROR] UNABLE TO READ PLAYER LEVEL");
            return 1; // fallback to safe value
        }

        return Number(levelText.textContent);
    }

    function getHPRatio() {
        let hpText = document.querySelector(HEALTH_TAG);
        if (!hpText) {
            console.log("[BOT ERROR] UNABLE TO READ HEALTH POINT");
            return 1; // fallback to safe value
        }

        let [current, max] = hpText.textContent.trim().split("/").map(Number);
        return current / max;
    }


    function isActivityRunning() {
        const bar = document.querySelector(ACTIVITY_PROGRESS_BAR_TAG);
        if (!bar) {
            console.log("[BOT ERROR] UNABLE TO READ ACTIVITY PROGRESS BAR");
            return false;
        }
        return bar.style.display != "none";
    }


    function getOpenedEquipmentStat() {
        const nameEl = document.querySelector(EQUIPMENT_DETAIL_NAME_TAG);
        const attackEl = document.querySelector(EQUIPMENT_DETAIL_ATK_TAG);
        const defenceEl = document.querySelector(EQUIPMENT_DETAIL_DEF_TAG);
        const rarityEl = document.querySelector(EQUIPMENT_DETAIL_RARITY_TAG);
        const typeEl = document.querySelector(EQUIPMENT_DETAIL_TYPE_TAG);
        const enhanceLevelEl = document.querySelector(EQUIPMENT_DETAIL_ENHANCE_LEVEL_TAG);

        let currentEquipmentStats = {
            "name": null,
            "attack": null,
            "defence": null,
            "rarity": null,
            "type": null,
            "enhanceLevel": null
        }

        if (!nameEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: NAME");
        } else {
            currentEquipmentStats["name"] = nameEl.textContent;
        }

        if (!attackEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: ATTACK BONUS");
        } else {
            currentEquipmentStats["attack"] = Number(attackEl.textContent);
        }

        if (!defenceEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: HEALTH BONUS");
        } else {
            currentEquipmentStats["defence"] = Number(defenceEl.textContent);
        }

        if (!rarityEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: RARITY");
        } else {
            currentEquipmentStats["rarity"] = rarityEl.textContent;
        }

        if (!typeEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: TYPE");
        } else {
            currentEquipmentStats["type"] = typeEl.textContent;
        }

        if (!enhanceLevelEl) {
            console.log("[BOT ERROR] UNABLE TO READ OPENED ITEM STAT: ENHANCE LEVEL");
        } else {
            currentEquipmentStats["enhanceLevel"] = Number(enhanceLevelEl.textContent);
        }

        return currentEquipmentStats;
    }

    function getEquipedItemsStats() {
        let currentEquipmentStats = {
            "currentWeapon": null,
            "currentArmor": null,
            "currentAccessory": null
        }

        const weaponEl = document.querySelector(EQUIPED_WEAPON_TAG);
        const armorEl = document.querySelector(EQUIPED_ARMOR_TAG);
        const accessoryEl = document.querySelector(EQUIPED_ACCESSORY_TAG);
        
        if (!weaponEl){
            console.log("[BOT ERROR] UNABLE TO READ EQUIPED WEAPON STAT");
        } else {
            if (!weaponEl.classList.contains("emtpy")) {
                weaponEl.click();
                currentEquipmentStats["currentWeapon"] = getOpenedEquipmentStat();
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }

        if (!armorEl){
            console.log("[BOT ERROR] UNABLE TO READ EQUIPED ARMOR STAT");
        } else {
            if (!armorEl.classList.contains("emtpy")) {
                armorEl.click();
                currentEquipmentStats["currentArmor"] = getOpenedEquipmentStat();
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }

        if (!accessoryEl){
            console.log("[BOT ERROR] UNABLE TO READ EQUIPED ACCESSORY STAT");
        } else {
            if (!accessoryEl.classList.contains("emtpy")) {
                accessoryEl.click();
                currentEquipmentStats["currentAccessory"] = getOpenedEquipmentStat();
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }
        if (DEBUG){
            console.log("[BOT DEBUG] Checked Current Equipment Stats:", currentEquipmentStats);
        }
        return currentEquipmentStats;
    }

    function isUpgradePriorityLarger(s1, s2){
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
        return Number(document.querySelector(UPGRADE_SCROLL_COUNT_TAG).textContent);
    }

    function getLowestEquipedLevel(){
        const equipedItemsStats = getEquipedItemsStats();
        let minLevel = Infinity;

        for (const stat of Object.values(equipedItemsStats)){
            if (stat) {
                if(stat["enhanceLevel"] != null) {
                    minLevel = Math.min(minLevel, stat["enhanceLevel"]);
                }
            }
        }
        return minLevel;
    }

    function clickElementWithTag(tag) {
        const element = document.querySelector(tag);
        if (!element) {
            console.log("[BOT ERROR] UNABLE TO FIND ELEMENT WITH TAG: ", tag);
            return false;
        } else {
            element.click();
            return true;
        }
    }

    function isButtonWithTagDisabled(buttonTag) {
        const button = document.querySelector(buttonTag);
        if (!button) {
            console.log("[BOT ERROR] UNABLE TO FIND ELEMENT WITH TAG: ", buttonTag);
            return true;
        } else {
            return button.disabled;
        }
    }

    function isModelWithTagHidden(modelTag) {
        const model = document.querySelector(modelTag);
        if (!model) {
            console.log("[BOT ERROR] UNABLE TO FIND MODEL WITH TAG: ", modelTag);
            return true;
        } else {
            return model.style.cssText == "display: none;";
        }
    }


    /******************************
     * MAIN FUNCTIONS
     ******************************/

    // Decide what action to take
    function chooseAdventure() {
        if (DEBUG){
            console.log("[BOT DEBUG] Deciding adventure...");
        }
        const hpRatio = getHPRatio();

        // Long rest if below 30% health
        if (hpRatio < HP_THRESHOLD_LONG) {
            console.log(`[BOT] HP low (${Math.round(hpRatio*100)}%). Long Resting.`);
            if (clickElementWithTag(LONG_REST_BUTTON_TAG)){
                return;
            }
        }
        
        // Short rest if below 70% health
        if (hpRatio < HP_THRESHOLD_SHORT) {
            console.log(`[BOT] HP semi-low (${Math.round(hpRatio*100)}%). Short Resting.`);
            if (clickElementWithTag(SHORT_REST_BUTTON_TAG)){
                return;
            }
        }

        // Go into boss fight if the win-rate is higher than the set level
        if (!isButtonWithTagDisabled(BOSS_CHALLENGE_TAG)) {
            clickElementWithTag(BOSS_CHALLENGE_TAG)

            let bossWinrateEl = document.querySelector(BOSS_WINRATE_TAG);

            if (!bossWinrateEl) {
                console.log("[BOT ERROR] UNABLE TO FIND BOSS WINRATE STAT");
            } else {
                try {
                    // Extract the number inside parentheses
                    let winRate = Number(bossWinrateEl.textContent.match(/\((\d+)%\)/)[1]) / 100;
                    
                    if (winRate >= BOSS_WINRATE_SETTING) {
                        console.log("[BOT] Win-rate is ", winRate * 100, "%, starting boss fight");
                        if(clickElementWithTag(CONFIRM_BOSS_CHALLENGE_TAG)){
                            return;
                        }
                    } else {
                        console.log("[BOT] Win-rate is ", winRate * 100, "%, aborting boss fight");
                        clickElementWithTag(CANCLE_BOSS_CHALLENGE_TAG);
                    }
                } catch {
                    console.log("[BOT ERROR] BOSS WINRATE STAT UNREADABLE");
                }
                
            }
        }
        
        // Go to resource adventure if current equipment is not yet +5
        if (getLowestEquipedLevel() <= SAFE_ENHANCE_LEVEL && getPlayerLevel() >= 10) {
            if (clickElementWithTag(RESOURCE_ADVENTURE_TAG)) {
                console.log("[BOT] Starting Resource Adventure");
                return
            }
        }

        // Deep adventure if player level is greater than 3
        if (getPlayerLevel() >= 3){
            console.log("[BOT] Starting Deep Adventure");
            if (clickElementWithTag(DEEP_ADVENTURE_TAG)){
                return;
            }
        }

        // Default to simple adventure
        console.log("[BOT] Starting Simple Adventure");
        clickElementWithTag(SIMPLE_ADVENTURE_TAG);
        return;
    }

    function equipBestInSlot(){
        if (DEBUG){
            console.log("[BOT DEBUG] Checking best in slot item...");
        }

        let currentEquipmentStats = getEquipedItemsStats();
        let currentSelectedItemStat = null;

        let inventory = document.querySelector(INVENTORY_TAG);
        if (!inventory){
            console.log("[BOT ERROR] UNABLE TO READ INVENTORY");
            return;
        }
        let currentInventoryItems = inventory.children;

        let bestItem = {
            "bestWeaponAtk": 0,
            "bestWeaponPos": -1,
            "bestArmorDef": 0,
            "bestArmorPos": -1,
            "bestAccessoryStat": 0,
            "bestAccessoryPos": -1
        };

        if (currentEquipmentStats["currentWeapon"]) {
            bestItem["bestWeaponAtk"] = currentEquipmentStats["currentWeapon"]["attack"];
        }

        if (currentEquipmentStats["currentArmor"]) {
            bestItem["bestArmorDef"] = currentEquipmentStats["currentArmor"]["defence"];
        }

        if (currentEquipmentStats["currentAccessory"]) {
            bestItem["bestAccessoryStat"] = currentEquipmentStats["currentAccessory"]["attack"] * HEALTH_PER_ATTACK_POWER + currentEquipmentStats["currentAccessory"]["defence"];
        }

        // Compare Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();
            if (isModelWithTagHidden(EQUIPMENT_DETAIL_MODEL_TAG)){
                continue;
            }

            currentSelectedItemStat = getOpenedEquipmentStat();

            // Ignore if the equipment is too high-level
            if (isButtonWithTagDisabled(EQUIP_BUTTON_TAG)){
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
                continue;
            }
            
            // Store item stat and position if its stat is better
            if (currentSelectedItemStat["type"] == "武器") {
                if (currentSelectedItemStat["attack"] > bestItem["bestWeaponAtk"]) {
                    bestItem["bestWeaponAtk"] = currentSelectedItemStat["attack"];
                    bestItem["bestWeaponPos"] = i;
                }
            } else if (currentSelectedItemStat["type"] == "防具") {
                if (currentSelectedItemStat["defence"] > bestItem["bestArmorDef"]) {
                    bestItem["bestArmorDef"] = currentSelectedItemStat["defence"];
                    bestItem["bestArmorPos"] = i;
                }
            } else if (currentSelectedItemStat["type"] == "飾品") {
                if (currentSelectedItemStat["attack"] * HEALTH_PER_ATTACK_POWER + currentSelectedItemStat["defence"] > bestItem["bestAccessoryStat"]) {
                    bestItem["bestAccessoryStat"] = currentSelectedItemStat["attack"] * HEALTH_PER_ATTACK_POWER + currentSelectedItemStat["defence"];
                    bestItem["bestAccessoryPos"] = i;
                }
            }
            clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
        }

        // Sort by descending order
        let toBeEquip = [bestItem["bestWeaponPos"], bestItem["bestArmorPos"], bestItem["bestAccessoryPos"]];
        toBeEquip = toBeEquip.filter(n => n >= 0).sort((a, b) => b - a);
        for (const pos of toBeEquip){
            currentInventoryItems[pos].click();
            if (clickElementWithTag(EQUIP_BUTTON_TAG)){
                console.log("[BOT] Equipped New Item"); // TO-DO: add item name
            }
        }
    }

    function deleteWorseItems() {
        if (DEBUG){
            console.log("[BOT DEBUG] Deleting worse items...");
        }
        

        let currentSelectedItemStat = null;
        let currentEquipmentStats = getEquipedItemsStats();

        let inventory = document.querySelector(INVENTORY_TAG);
        if (!inventory){
            console.log("[BOT ERROR] UNABLE TO READ INVENTORY");
            return;
        }
        let currentInventoryItems = inventory.children;

        let allWeapons = {};
        let allArmors = {};
        let allAccessory = {};
        let toBeDelete = [];

        // Store Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();
            if (isModelWithTagHidden(EQUIPMENT_DETAIL_MODEL_TAG)){
                continue;
            }

            currentSelectedItemStat = getOpenedEquipmentStat();

            // Ignore if the equipment is too high-level
            if (isButtonWithTagDisabled(EQUIP_BUTTON_TAG)){
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
                continue;
            }

            // Delete item if its rarity is lower than current equipped item
            // Else store item stat and position
            if (currentSelectedItemStat["type"] == "武器") {
                if (currentEquipmentStats["currentWeapon"] != null && RARITY_RANKING[currentEquipmentStats["currentWeapon"]["rarity"]] > RARITY_RANKING[currentSelectedItemStat["rarity"]]){
                    if(clickElementWithTag(DELETE_ITEM_TAG)){
                        console.log("[BOT] Deleted Item"); // TO-DO: ADD ITEM NAME
                        continue;
                    }
                }
                allWeapons[i] = currentSelectedItemStat["attack"];
            } else if (currentSelectedItemStat["type"] == "防具") {
                if (currentEquipmentStats["currentArmor"] != null && RARITY_RANKING[currentEquipmentStats["currentArmor"]["rarity"]] > RARITY_RANKING[currentSelectedItemStat["rarity"]]){
                    if(clickElementWithTag(DELETE_ITEM_TAG)){
                        console.log("[BOT] Deleted Item"); // TO-DO: ADD ITEM NAME
                        continue;
                    }
                }
                allArmors[i] = currentSelectedItemStat["defence"];
            } else if (currentSelectedItemStat["type"] == "飾品") {
                if (currentEquipmentStats["currentAccessory"] != null && RARITY_RANKING[currentEquipmentStats["currentAccessory"]["rarity"]] > RARITY_RANKING[currentSelectedItemStat["rarity"]]){
                    if(clickElementWithTag(DELETE_ITEM_TAG)){
                        console.log("[BOT] Deleted Item"); // TO-DO: ADD ITEM NAME
                        continue;
                    }
                }
                allAccessory[i] = currentSelectedItemStat["attack"] * HEALTH_PER_ATTACK_POWER + currentSelectedItemStat["defence"];
            }
            clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
        }

        if (allWeapons.length > KEEP_SAME_LEVEL_AMOUNT){
            const remainingKeys = Object.entries(allWeapons)
                .sort((a, b) => b[1] - a[1])
                .slice(10)
                .map(([key, value]) => key);
            toBeDelete.push(remainingKeys);
        }

        if (allArmors.length > KEEP_SAME_LEVEL_AMOUNT){
            const remainingKeys = Object.entries(allArmors)
                .sort((a, b) => b[1] - a[1])
                .slice(10)
                .map(([key, value]) => key);
            toBeDelete.push(remainingKeys);
        }

        if (allAccessory.length > KEEP_SAME_LEVEL_AMOUNT){
            const remainingKeys = Object.entries(allAccessory)
                .sort((a, b) => b[1] - a[1])
                .slice(10)
                .map(([key, value]) => key);
            toBeDelete.push(remainingKeys);
        }

        toBeDelete.sort((a, b) => b - a);

        for (const pos of toBeDelete){
            currentInventoryItems[pos].click();
            if (clickElementWithTag(DELETE_ITEM_TAG)){
                console.log("[BOT] Deleted Item"); // TO-DO: add item name
            } else {
                console.log("[BOT ERROR] UNABLE TO DELETE ITEM"); // TO-DO: add item name
            }
        }
    }

    function enhanceEquipedEquipments(){
        if (DEBUG) {
            console.log("[BOT DEBUG] Leveling up equiped items...");
        }
        

        if (getScrollCount() == 0){
            if (DEBUG) {
                console.log("[BOT DEBUG] Currently has no scrolls");
            }
            return false;
        }

        const equipedItemsStats = getEquipedItemsStats(); 

        if (equipedItemsStats["currentAccessory"] != null && equipedItemsStats["currentAccessory"]["enhanceLevel"] <= SAFE_ENHANCE_LEVEL){
            if (clickElementWithTag(EQUIPED_ACCESSORY_TAG)){
                if (clickElementWithTag(ENHANCE_ITEM_TAG)) {
                    console.log("[BOT] Leveled up equipped accessory");
                    clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
                    return true;
                } else {
                    console.log("[BOT ERROR] UNABLE TO LEVEL UP ACCESSORY");
                }
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }

        if (equipedItemsStats["currentWeapon"] != null && equipedItemsStats["currentWeapon"]["enhanceLevel"] <= SAFE_ENHANCE_LEVEL){
            if (clickElementWithTag(EQUIPED_WEAPON_TAG)){
                if (clickElementWithTag(ENHANCE_ITEM_TAG)) {
                    console.log("[BOT] Leveled up equipped weapon");
                    clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
                    return true;
                } else {
                    console.log("[BOT ERROR] UNABLE TO LEVEL UP WEAPON");
                }
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }

        if (equipedItemsStats["currentArmor"] != null && equipedItemsStats["currentArmor"]["enhanceLevel"] <= SAFE_ENHANCE_LEVEL){
            if (clickElementWithTag(EQUIPED_ARMOR_TAG)){
                if (clickElementWithTag(ENHANCE_ITEM_TAG)) {
                    console.log("[BOT] Leveled up equipped armor");
                    clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
                    return true;
                } else {
                    console.log("[BOT ERROR] UNABLE TO LEVEL UP ARMOR");
                }
                clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
            }
        }
        console.log("All equiped items has reached level 5");
        return false;
    }

    function enhanceBackpackItems(){
        if (DEBUG) {
            console.log("[BOT DEBUG] Leveling up stored items...");
        }

        if (getScrollCount() == 0){
            if (DEBUG) {
                console.log("[BOT DEBUG] Currently has no scrolls");
            }
            return false;
        }

        let currentSelectedItemStat = null;
        let equipedItemsStats = getEquipedItemsStats();
        let equipedWeapon = equipedItemsStats["currentWeapon"]
        let equipedArmor = equipedItemsStats["currentArmor"]
        let equipedAccessory = equipedItemsStats["currentAccessory"]

        let inventory = document.querySelector(INVENTORY_TAG);
        if (!inventory){
            console.log("[BOT ERROR] UNABLE TO READ INVENTORY");
            return;
        }
        let currentInventoryItems = inventory.children;

        let toBeUpgradeWeapon = {
            "rarity": "普通",
            "level": 0,
            "position": -1
        }

        let toBeUpgradeArmor = {
            "rarity": "普通",
            "level": 0,
            "position": -1
        }

        let toBeUpgradeAccessory = {
            "rarity": "普通",
            "level": 0,
            "position": -1
        }

       // Store Item Stats
        for (let i = 0; i < currentInventoryItems.length; i++) {
            currentInventoryItems[i].click();

            if (isModelWithTagHidden(EQUIPMENT_DETAIL_MODEL_TAG)){
                continue;
            }

            currentSelectedItemStat = getOpenedEquipmentStat();

            if (currentSelectedItemStat["type"] == "武器") {
                if (RARITY_RANKING[currentSelectedItemStat["rarity"]] > RARITY_RANKING[equipedWeapon["rarity"]]) {
                    if (equipedWeapon != null && RARITY_RANKING[currentSelectedItemStat["rarity"]] > RARITY_RANKING[equipedWeapon["rarity"]]){
                        if (currentSelectedItemStat["level"] <= SAFE_ENHANCE_LEVEL){
                            toBeUpgradeWeapon["rarity"] = currentSelectedItemStat["rarity"];
                            toBeUpgradeWeapon["level"] = currentSelectedItemStat["enhanceLevel"];
                            toBeUpgradeWeapon["position"] = i;
                        }
                    } else if (equipedWeapon != null && RARITY_RANKING[currentSelectedItemStat["rarity"]] == RARITY_RANKING[equipedWeapon["rarity"]]) {
                        toBeUpgradeWeapon["rarity"] = currentSelectedItemStat["rarity"];
                        toBeUpgradeWeapon["level"] = currentSelectedItemStat["enhanceLevel"];
                        toBeUpgradeWeapon["position"] = i;
                    }
                } else if (RARITY_RANKING[currentSelectedItemStat["rarity"]] == RARITY_RANKING[equipedWeapon["rarity"]] && currentSelectedItemStat["enhanceLevel"] > toBeUpgradeWeapon["level"]) {
                    toBeUpgradeWeapon["rarity"] = currentSelectedItemStat["rarity"];
                    toBeUpgradeWeapon["level"] = currentSelectedItemStat["enhanceLevel"];
                    toBeUpgradeWeapon["position"] = i;
                }
            } else if (currentSelectedItemStat["type"] == "防具") {
                if (RARITY_RANKING[currentSelectedItemStat["rarity"]] > RARITY_RANKING[equipedArmor["rarity"]]) {
                    if (equipedArmor != null && RARITY_RANKING[currentSelectedItemStat["rarity"]] > RARITY_RANKING[equipedArmor["rarity"]]){
                        if (currentSelectedItemStat["level"] <= SAFE_ENHANCE_LEVEL){
                            toBeUpgradeArmor["rarity"] = currentSelectedItemStat["rarity"];
                            toBeUpgradeArmor["level"] = currentSelectedItemStat["enhanceLevel"];
                            toBeUpgradeArmor["position"] = i;
                        }
                    } else if (equipedArmor != null && RARITY_RANKING[currentSelectedItemStat["rarity"]] == RARITY_RANKING[equipedArmor["rarity"]]) {
                        toBeUpgradeArmor["rarity"] = currentSelectedItemStat["rarity"];
                        toBeUpgradeArmor["level"] = currentSelectedItemStat["enhanceLevel"];
                        toBeUpgradeArmor["position"] = i;
                    }
                } else if (RARITY_RANKING[currentSelectedItemStat["rarity"]] == RARITY_RANKING[equipedArmor["rarity"]] && currentSelectedItemStat["enhanceLevel"] > toBeUpgradeArmor["level"]) {
                    toBeUpgradeArmor["rarity"] = currentSelectedItemStat["rarity"];
                    toBeUpgradeArmor["level"] = currentSelectedItemStat["enhanceLevel"];
                    toBeUpgradeArmor["position"] = i;
                }
            } else if (currentSelectedItemStat["type"] == "飾品") {
                if (RARITY_RANKING[currentSelectedItemStat["rarity"]] > RARITY_RANKING[equipedAccessory["rarity"]]) {
                    if (equipedAccessory != null && RARITY_RANKING[currentSelectedItemStat["rarity"]] > RARITY_RANKING[equipedAccessory["rarity"]]){
                        if (currentSelectedItemStat["level"] <= SAFE_ENHANCE_LEVEL){
                            toBeUpgradeAccessory["rarity"] = currentSelectedItemStat["rarity"];
                            toBeUpgradeAccessory["level"] = currentSelectedItemStat["enhanceLevel"];
                            toBeUpgradeAccessory["position"] = i;
                        }
                    } else if (equipedAccessory != null && RARITY_RANKING[currentSelectedItemStat["rarity"]] == RARITY_RANKING[equipedAccessory["rarity"]]) {
                        toBeUpgradeAccessory["rarity"] = currentSelectedItemStat["rarity"];
                        toBeUpgradeAccessory["level"] = currentSelectedItemStat["enhanceLevel"];
                        toBeUpgradeAccessory["position"] = i;
                    }
                } else if (RARITY_RANKING[currentSelectedItemStat["rarity"]] == RARITY_RANKING[equipedAccessory["rarity"]] && currentSelectedItemStat["enhanceLevel"] > toBeUpgradeAccessory["level"]) {
                    toBeUpgradeAccessory["rarity"] = currentSelectedItemStat["rarity"];
                    toBeUpgradeAccessory["level"] = currentSelectedItemStat["enhanceLevel"];
                    toBeUpgradeAccessory["position"] = i;
                }
            }
            clickElementWithTag(CLOSE_EQUIPMENT_BUTTON_TAG);
        }


        let finalScore = [
            RARITY_RANKING[toBeUpgradeWeapon["rarity"]] * 1000 - toBeUpgradeWeapon["level"] * 10 + 2,
            RARITY_RANKING[toBeUpgradeArmor["rarity"]] * 1000 - toBeUpgradeArmor["level"] * 10 + 1,
            RARITY_RANKING[toBeUpgradeAccessory["rarity"]] * 1000 - toBeUpgradeAccessory["level"] * 10 + 3
        ]
        
        finalScore = finalScore.sort((a, b) => b - a);

        let toBeUpgradePos = -1;

        if (finalScore[0] % 10 == 2) {
            toBeUpgradePos = toBeUpgradeWeapon["position"];
        } else if (finalScore[0] % 10 == 1) {
            toBeUpgradePos = toBeUpgradeArmor["position"];
        } else if (finalScore[0] % 10 == 3) {
            toBeUpgradePos = toBeUpgradeAccessory["position"];
        } else {
            console.log("[BOT ERROR] ERROR WHEN CALCULATING FINAL SCORE FOR INVENTORY ITEMS TO UPGRADE");
            return false;
        }

        if (toBeUpgradePos != -1) {
            currentInventoryItems[toBeUpgradePos].click();
            if (clickElementWithTag(ENHANCE_ITEM_TAG)) {
                console.log("[BOT] Upgraded Item"); // TO-DO: ADD ITEM NAME
                return true;
            }
            console.log("[BOT ERROR] ERROR WHEN UPGRADING INVENTORY ITEM");
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
    let lastLogTime = 0;
    
    setInterval(() => {
        const running = isActivityRunning();
        const now = Date.now();
        
        if (now - lastLogTime >= LOG_INTERVAL) {
            lastLogTime = now;
            console.log(`[BOT] Tick | HP: ${Math.round(getHPRatio()*100)}% | In Activity: ${running}`);
        }
    
        if (!running) {
            EquipUpgradeAndDeleteItems();
            chooseAdventure();
        }
    
    }, ACTION_INTERVAL);
})();