import { execSync } from "child_process";
import fs from 'fs'

const lambdaDir = "dist/lambda-fns";
const lambdas = fs.readdirSync(lambdaDir);

lambdas
  .filter((p) => {
    const fi = fs.statSync(`${lambdaDir}/${p}`);
    return fi.isDirectory();
  })
  .forEach((p) => {
    execSync(`cd ${lambdaDir}/${p} && zip -r ../${p}.zip .`);
    console.log(`Created ${p}.zip`);
  });
