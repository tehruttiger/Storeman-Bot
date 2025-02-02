import { CommandInteraction, GuildMember } from "discord.js";
import { getCollections } from './../mongoDB';
import argon2 from 'argon2';
import checkPermissions from "../Utils/checkPermissions";


const spsetpassword = async (interaction: CommandInteraction): Promise<boolean> => {
    const password = interaction.options.getString("password")! // Tell typescript to shut up and it is non-null
    if (!(await checkPermissions(interaction, "admin", interaction.member as GuildMember))) return false
    
    if (!password) {
        await interaction.reply({
            content: "Missing parameters",
            ephemeral: true
        });
        return false
    }

    const collections = getCollections()
    collections.config.updateOne({}, { $set: { password: await argon2.hash(password) } })

    await interaction.reply({
        content: "Password successfully changed.",
        ephemeral: true
    });

    return true;
}

export default spsetpassword
