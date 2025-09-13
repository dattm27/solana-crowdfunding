use anchor_lang::prelude::*;

declare_id!("1VCbnJ4VUHVzwbALXSKwDXCksruAmk41ZoSDdEzAjPe");

#[program]
pub mod crowdfunding {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
